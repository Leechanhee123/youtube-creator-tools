from supabase import create_client, Client
from src.core.config import settings
from typing import Optional

class SupabaseClient:
    def __init__(self):
        self.client: Optional[Client] = None
        
    def connect(self) -> Client:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")
            
        if not self.client:
            self.client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_KEY
            )
        return self.client
    
    def get_client(self) -> Client:
        if not self.client:
            return self.connect()
        return self.client

supabase_client = SupabaseClient()