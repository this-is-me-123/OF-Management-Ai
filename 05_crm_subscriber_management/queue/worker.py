import redis
import json
import time
import requests

r = redis.Redis(host='localhost', port=6379, db=0)

def queue_worker():
    print("CRM Worker running...")
    while True:
        job_data = r.brpop("crm_message_queue", timeout=5)
        if job_data:
            _, job_str = job_data
            job = json.loads(job_str)
            print(f"Processing job: {job}")
            try:
                res = requests.post("http://localhost:5001/send", json=job)
                print("Sent message:", res.json())
            except Exception as e:
                print("Failed to send message:", e)

if __name__ == "__main__":
    queue_worker()
