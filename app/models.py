class ComplianceJob:
    sla_deadline = None
    status = None
    external_id = None
    records_affected = None


class Store:
    def __init__(self):
        self.access_token = None


class Account:
    pass


class User:
    pass


class Dispute:
    deleted_at = None
    customer_name_display = None
    customer_email_hash = None
