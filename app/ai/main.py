
import instructor

from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException
from pydantic import BaseModel, Field, BeforeValidator, create_model
from typing import Annotated, Type, Any
import base64
import json
import pymupdf
import logfire

logfire.configure()
logfire.instrument_openai()

app = FastAPI()

_type_map = {t.__name__: t for t in (str, float, int, bool)}

def _str_to_type(v):
    if isinstance(v, str):
        try:
            return _type_map[v]
        except KeyError:
            raise ValueError(f"'{v}' no es un tipo permitido")
    return v


DType = Annotated[Type[Any], BeforeValidator(_str_to_type)]

class OutputField(BaseModel):
    name: str
    description: str
    dtype: DType

def build_output_schema(fields: list[OutputField]) -> Type[BaseModel]:
    annotations: dict[str, tuple[type, Any]] = {}
    for f in fields:
        field_model = create_model(
            f"FieldResult_{f.name}",
            confidence_degree=(int, Field(..., description="Confidence degree between 1 and 10", ge=1, le=10)),
            result=(f.dtype, Field(..., description=f.description)),
            explanation=(str, Field(..., description="Explanation of the field result and confidence level, follow the rules provided to you"))
        )
        annotations[f.name] = (field_model, Field(..., description=f"Result and confidence score for {f.name}"))
    
    return create_model(
        "Response", **annotations
    )
 
def pdf_as_images(content, inst_img_list):
    doc = pymupdf.open(stream = content)
    for page in doc:
        pix = page.get_pixmap(dpi = 200)
        b64 = base64.b64encode(pix.tobytes("png")).decode()
        data_uri = f"data:image/png;base64,{b64}"
        inst_img_list.append(instructor.Image.from_base64(data_uri))


class AnalyzeFilesRequest(BaseModel):
    provider: str
    description: str
    tag: str
    output_fields: list[OutputField]

    @classmethod
    def as_form(
        cls,
        provider: str = Form("openai/o3"),
        description: str = Form(...),
        output_fields: str = Form(...),
        tag: str = Form(...)
    ):
        return cls(
            provider=provider,
            description=description,
            output_fields=json.loads(output_fields),
            tag = tag
        )


@app.post("/images/analyze")
@logfire.instrument("analyze_doc", extract_args=True)
async def analyze_images(
    request: Annotated[AnalyzeFilesRequest, Depends(AnalyzeFilesRequest.as_form)],
    files: list[UploadFile] = File(...),
):
    inst_imgs = []
    for f in files:
        is_pdf, is_img = f.content_type.startswith("application/pdf"), f.content_type.startswith("image/")
        if not (f.content_type and [is_pdf, is_img]):
            raise HTTPException(
                status_code=415,
                detail=f"El archivo «{f.filename}» no es una imagen"
            )
        
        content = await f.read()
        if not content:
            raise HTTPException(
                status_code=400,
                detail=f"El archivo «{f.filename}» está vacío"
            )
        
        if is_pdf:
            pdf_as_images(content, inst_imgs)
            continue
        
        b64 = base64.b64encode(content).decode()
        data_uri = f"data:{f.content_type};base64,{b64}"
        inst_imgs.append(
            instructor.Image.from_base64(data_uri)
        )

    client = instructor.from_provider(request.provider, async_client = True)

    OutputModel = build_output_schema(request.output_fields)
    output_fields = [f"Name: {r.name}\nDescription:{r.description}" for r in request.output_fields]
    response = await client.chat.completions.create(
        messages = [
            {
                "role": "system",
                "content": """
                ## Task context
                You are a document-analysis assistant supporting an operations team.
                Your task is to extract the specific fields requested from the supplied documents.
                
                ## Considerations
                Consider the type of document you are working with (bank statements, ids, invoices, ...), if it is a standard document, where its from... And based on that and your knowledge identify the fields that the user asked for.
                The fields may appear implicitly or explicitly, and sometimes you may have to infer them where the value that you asked for is depending on your knowledge of the document, or that the type of field that is being asked usually dont appear in docs like the doc it was provided.
                You must provide a confidence level to each field, and you will explain how you extracted the field and where did you find it in the document.
                In the case that confidence level is below 7 you will provide actionable insights an explanation regarding why you didn't find it.
                This insights are meant to help the ops team and they will provide actions and insights for them so they can either take actions or take a look in more depth.
                In the case of confidence level >= 7, the explanation should be brief.
                Only state what you are certain about, do not invent values. Be neutral and direct in your langauge.

                ## Output

                A structured output the fields that have been extracted.

                For each field you should provide:
                confidence_degree: 1-10
                result: The extracted value in the type that is specified to you
                explanation: if conf >= 7, brief explanation on where it was. If <7, actionable insights for ops team."""
            },
            {
                "role": "user",
                "content": [
                    f"## Document description\n\n{request.description}\n\n**Tag:** {request.tag}\n\n## Fields to extract\n\n{output_fields}\n\n---  \nHere are the images/pdfs corresponding to the document/s:",
                    *inst_imgs
                ]
            }],
        response_model = OutputModel,
        reasoning_effort = "high"
    )
    return response