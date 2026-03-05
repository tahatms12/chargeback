class _Limiter:
    def limit(self, rule: str):
        def deco(fn):
            fn._rate_limit = rule
            return fn
        return deco


limiter = _Limiter()
oauth_limit = limiter.limit("10/minute")
billing_limit = limiter.limit("5/minute")
export_limit = limiter.limit("10/minute")
upload_limit = limiter.limit("20/minute")
api_limit = limiter.limit("120/minute")
