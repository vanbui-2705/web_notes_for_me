try:
    invalid_data = {"id" : 11, "name" : "", "age" : 17, "email" : "invalidemail"}
    UserModel(**invalid_data)
except Exception as e:
    print(e) # in ra loi cu the