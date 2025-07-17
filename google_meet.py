from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
import os

SCOPES = ['https://www.googleapis.com/auth/calendar']


def get_google_meet_link():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file(
            'credentials.json', SCOPES)
        creds = flow.run_local_server(port=8080)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())

    service = build('calendar', 'v3', credentials=creds)
    event = {
        'summary': 'Diabetes Risk Consultation',
        'start': {'dateTime': '2025-07-16T15:30:00+05:30', 'timeZone': 'Asia/Kolkata'},
        'end': {'dateTime': '2025-07-16T16:00:00+05:30', 'timeZone': 'Asia/Kolkata'},
        'conferenceData': {
            'createRequest': {'conferenceSolutionKey': {'type': 'hangoutsMeet'}}
        }
    }
    event = service.events().insert(calendarId='primary', body=event,
                                    conferenceDataVersion=1).execute()
    # Fallback if Meet link fails
    return event.get('hangoutLink', 'https://meet.google.com/new')
