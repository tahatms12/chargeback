class HTTPException(Exception):
    def __init__(self, status_code: int, detail: str = ""):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)


class Request:
    def __init__(self, headers=None, query_params=None):
        self.headers = headers or {}
        self.query_params = query_params or {}


class APIRouter:
    def get(self, *args, **kwargs):
        def deco(fn):
            return fn
        return deco

    def post(self, *args, **kwargs):
        def deco(fn):
            return fn
        return deco


def Depends(x):
    return x


def Query(default=None, **kwargs):
    return default
