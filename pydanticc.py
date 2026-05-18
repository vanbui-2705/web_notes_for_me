import asyncio
import time
from pydantic import BaseModel, Field, field_validator, model_validator

class PriceRange(BaseModel):
    min_price: float = Field(..., gt=0)
    max_price: float = Field(..., gt=min_price)
    # Kiem tra logc giua cac truong sau khi du lieu tho di vao
    @model_validator(mode='after')
    def check_password_mathch(self) -> 'PriceRange':
        if self.max_price <= self.min_price:
            raise ValueError('max_price must be greater than min_price')
        return self
class AlterConfig(BaseModel):
    user_id : int
    coin_symbol : str
    range_setting : PriceRange

    @field_validator('coin_symbol')
    def uppper_coin_symbol(cls, v ) :
        return v.upper()
#---- test case ---------
if __name__ == "__main__":
    print("---Test case 1: Du lieu hop le---")

    good_data = {
        "user_id": 123,
        "coin_symbol": "btc",
        "range_setting": {
            "min_price": 10000,
            "max_price": 50000
        }
    }
    config = AlterConfig(**good_data)
    print(config.model_dump_json(indent=4))

#---- test case ---------
    print("---Test case 2: Du lieu khong hop le---")
    bad_data = {
        "user_id": 123,
        "coin_symbol": "btc",
        "range_setting": {
            "min_price": 10000,
            "max_price": 5000
        }
    }
    try:
        AlterConfig(**bad_data)
    except ValueError as e:
        print("Bat duoc loi thanh cong")
        print(f"Error: {e}")