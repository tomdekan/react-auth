from ninja import ModelSchema
from .models import CustomUser
from pydantic import BaseModel


class UserSchema(ModelSchema):
    class Config:
        model = CustomUser
        model_fields = ['id', 'username', 'email']


class SignInSchema(BaseModel):
    email: str
    password: str

