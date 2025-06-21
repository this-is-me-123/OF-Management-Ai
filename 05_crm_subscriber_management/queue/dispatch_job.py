import redis
import json

r = redis.Redis(host='localhost', port=6379, db=0)

def dispatch_message_job(username, tier, message_type):
    job = {
        "username": username,
        "tier": tier,
        "message_type": message_type
    }
    r.lpush("crm_message_queue", json.dumps(job))
    print(f"Dispatched job for {username}")
