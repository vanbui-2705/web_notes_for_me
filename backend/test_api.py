import urllib.request
import json

data = json.dumps({
    "date": "2026-05-25",
    "metric_type": "mood",
    "value": "1"
}).encode('utf-8')

req = urllib.request.Request('http://127.0.0.1:8000/metrics/daily', data=data, headers={'Content-Type': 'application/json', 'Authorization': 'Bearer test-token'})

try:
    response = urllib.request.urlopen(req)
    print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.code, e.reason)
    print(e.read().decode('utf-8'))
