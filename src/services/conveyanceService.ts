const API_URL = 'https://wildlifenl-uu-michi011.apps.cl01.cp.its.uu.nl/conveyances/experiment/';
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const getConveyancesByExperimentID = async (id: string): Promise<any[]> => {
  try {
    // Comment out real fetch for now; replace with mock for easy reversion later.
    /*
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    const response = await fetch(`${API_URL}${id}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json, application/problem+json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch responses: ${errorText}`);
    }
    const data = await response.json();
    return data as any[];
    */

    // Use mocked data instead:
    return [
      {
        "ID": "c945f88d-5f63-49b4-bd82-c9a6340cf861",
        "alarm": {
          "ID": "a72f8a29-d0d0-4c2b-8c29-8c209caea280",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-01T09:00:00Z",
          "zone": {
            "ID": "3c891f08-5cc4-41ce-bd4a-6393ca9c9413"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "08a62197-172b-4d29-9f90-3b8f0864de15",
          "location": {
            "latitude": 51.12345,
            "longitude": 4.56789
          },
          "locationTimestamp": "2025-01-01T08:59:00Z",
          "name": "Mock Animal #1",
          "species": {
            "ID": "4baec58b-e54b-4ae8-a2b7-e513e84bc627",
            "name": "Species A"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "5f72adf3-361c-4b19-853b-a82062a1fa46",
          "activity": 1,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "7dfbe450-ab85-441a-a775-58bcbd39b091",
            "name": "Mock Experiment #1"
          },
          "name": "Mock Message #1",
          "severity": 2,
          "species": null,
          "text": "Message text #1",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-01T09:05:00Z",
        "user": {
          "ID": "a24a3cd9-7dba-4de6-b37c-37e356cb0606",
          "name": "User #1"
        }
      },
      {
        "ID": "e70f5fc1-f25e-45a1-a252-7bba39900f80",
        "alarm": {
          "ID": "843289be-b4cb-434b-a247-8587156b2ea0",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-02T10:00:00Z",
          "zone": {
            "ID": "d5e87361-bc39-44d0-b399-7491b2d7b47a"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "64fa91a3-4ffa-4245-b647-8b488171c079",
          "location": {
            "latitude": 50.98765,
            "longitude": 3.67890
          },
          "locationTimestamp": "2025-01-02T09:59:00Z",
          "name": "Mock Animal #2",
          "species": {
            "ID": "c47af21d-129c-4ccf-b6a0-16b15ed37ab6",
            "name": "Species B"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "f511d903-8e65-4cf4-9c7d-58de8d8955b6",
          "activity": 2,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "a29d64b3-7173-4d61-9fc9-f97a049a25b5",
            "name": "Mock Experiment #2"
          },
          "name": "Mock Message #2",
          "severity": 3,
          "species": null,
          "text": "Message text #2",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-02T10:05:00Z",
        "user": {
          "ID": "fc585537-2938-41e4-a4de-818e369573bd",
          "name": "User #2"
        }
      },
      {
        "ID": "db30aae7-5bc0-4805-9e9b-16c8db38a50d",
        "alarm": {
          "ID": "9b3575c1-7e38-4fe6-9fbf-6c742381abe2",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-03T11:00:00Z",
          "zone": {
            "ID": "75a02fa7-7049-4140-9fd1-079deaf0befa"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "7d2f4e54-c624-4024-b178-513e82c3b5be",
          "location": {
            "latitude": 52.11111,
            "longitude": 4.11111
          },
          "locationTimestamp": "2025-01-03T10:59:00Z",
          "name": "Mock Animal #3",
          "species": {
            "ID": "45aaed1c-55ce-4fcc-87bf-f508ca86ef54",
            "name": "Species C"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "c88afe30-838f-44ef-8fd0-6292573b28de",
          "activity": 3,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "9e0712af-3642-49ad-bf74-e5c7723ab4f4",
            "name": "Mock Experiment #3"
          },
          "name": "Mock Message #3",
          "severity": 1,
          "species": null,
          "text": "Message text #3",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-03T11:05:00Z",
        "user": {
          "ID": "6c03c54f-1825-4f8c-ae2f-47f5fd425b8e",
          "name": "User #3"
        }
      },
      {
        "ID": "c945f88d-5f63-49b4-bd82-c9a6340cf861",
        "alarm": {
          "ID": "a72f8a29-d0d0-4c2b-8c29-8c209caea280",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-01T09:00:00Z",
          "zone": {
            "ID": "3c891f08-5cc4-41ce-bd4a-6393ca9c9413"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "08a62197-172b-4d29-9f90-3b8f0864de15",
          "location": {
            "latitude": 51.12345,
            "longitude": 4.56789
          },
          "locationTimestamp": "2025-01-01T08:59:00Z",
          "name": "Mock Animal #1",
          "species": {
            "ID": "4baec58b-e54b-4ae8-a2b7-e513e84bc627",
            "name": "Species A"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "5f72adf3-361c-4b19-853b-a82062a1fa46",
          "activity": 1,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "7dfbe450-ab85-441a-a775-58bcbd39b091",
            "name": "Mock Experiment #1"
          },
          "name": "Mock Message #1",
          "severity": 2,
          "species": null,
          "text": "Message text #1",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-01T09:05:00Z",
        "user": {
          "ID": "a24a3cd9-7dba-4de6-b37c-37e356cb0606",
          "name": "User #1"
        }
      },
      {
        "ID": "e70f5fc1-f25e-45a1-a252-7bba39900f80",
        "alarm": {
          "ID": "843289be-b4cb-434b-a247-8587156b2ea0",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-02T10:00:00Z",
          "zone": {
            "ID": "d5e87361-bc39-44d0-b399-7491b2d7b47a"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "64fa91a3-4ffa-4245-b647-8b488171c079",
          "location": {
            "latitude": 50.98765,
            "longitude": 3.67890
          },
          "locationTimestamp": "2025-01-02T09:59:00Z",
          "name": "Mock Animal #2",
          "species": {
            "ID": "c47af21d-129c-4ccf-b6a0-16b15ed37ab6",
            "name": "Species B"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "f511d903-8e65-4cf4-9c7d-58de8d8955b6",
          "activity": 2,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "a29d64b3-7173-4d61-9fc9-f97a049a25b5",
            "name": "Mock Experiment #2"
          },
          "name": "Mock Message #2",
          "severity": 3,
          "species": null,
          "text": "Message text #2",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-02T10:05:00Z",
        "user": {
          "ID": "fc585537-2938-41e4-a4de-818e369573bd",
          "name": "User #2"
        }
      },
      {
        "ID": "db30aae7-5bc0-4805-9e9b-16c8db38a50d",
        "alarm": {
          "ID": "9b3575c1-7e38-4fe6-9fbf-6c742381abe2",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-03T11:00:00Z",
          "zone": {
            "ID": "75a02fa7-7049-4140-9fd1-079deaf0befa"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "7d2f4e54-c624-4024-b178-513e82c3b5be",
          "location": {
            "latitude": 52.11111,
            "longitude": 4.11111
          },
          "locationTimestamp": "2025-01-03T10:59:00Z",
          "name": "Mock Animal #3",
          "species": {
            "ID": "45aaed1c-55ce-4fcc-87bf-f508ca86ef54",
            "name": "Species C"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "c88afe30-838f-44ef-8fd0-6292573b28de",
          "activity": 3,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "9e0712af-3642-49ad-bf74-e5c7723ab4f4",
            "name": "Mock Experiment #3"
          },
          "name": "Mock Message #3",
          "severity": 1,
          "species": null,
          "text": "Message text #3",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-03T11:05:00Z",
        "user": {
          "ID": "6c03c54f-1825-4f8c-ae2f-47f5fd425b8e",
          "name": "User #3"
        }
      },
      {
        "ID": "c945f88d-5f63-49b4-bd82-c9a6340cf861",
        "alarm": {
          "ID": "a72f8a29-d0d0-4c2b-8c29-8c209caea280",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-01T09:00:00Z",
          "zone": {
            "ID": "3c891f08-5cc4-41ce-bd4a-6393ca9c9413"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "08a62197-172b-4d29-9f90-3b8f0864de15",
          "location": {
            "latitude": 51.12345,
            "longitude": 4.56789
          },
          "locationTimestamp": "2025-01-01T08:59:00Z",
          "name": "Mock Animal #1",
          "species": {
            "ID": "4baec58b-e54b-4ae8-a2b7-e513e84bc627",
            "name": "Species A"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "5f72adf3-361c-4b19-853b-a82062a1fa46",
          "activity": 1,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "7dfbe450-ab85-441a-a775-58bcbd39b091",
            "name": "Mock Experiment #1"
          },
          "name": "Mock Message #1",
          "severity": 2,
          "species": null,
          "text": "Message text #1",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-01T09:05:00Z",
        "user": {
          "ID": "a24a3cd9-7dba-4de6-b37c-37e356cb0606",
          "name": "User #1"
        }
      },
      {
        "ID": "e70f5fc1-f25e-45a1-a252-7bba39900f80",
        "alarm": {
          "ID": "843289be-b4cb-434b-a247-8587156b2ea0",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-02T10:00:00Z",
          "zone": {
            "ID": "d5e87361-bc39-44d0-b399-7491b2d7b47a"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "64fa91a3-4ffa-4245-b647-8b488171c079",
          "location": {
            "latitude": 50.98765,
            "longitude": 3.67890
          },
          "locationTimestamp": "2025-01-02T09:59:00Z",
          "name": "Mock Animal #2",
          "species": {
            "ID": "c47af21d-129c-4ccf-b6a0-16b15ed37ab6",
            "name": "Species B"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "f511d903-8e65-4cf4-9c7d-58de8d8955b6",
          "activity": 2,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "a29d64b3-7173-4d61-9fc9-f97a049a25b5",
            "name": "Mock Experiment #2"
          },
          "name": "Mock Message #2",
          "severity": 3,
          "species": null,
          "text": "Message text #2",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-02T10:05:00Z",
        "user": {
          "ID": "fc585537-2938-41e4-a4de-818e369573bd",
          "name": "User #2"
        }
      },
      {
        "ID": "db30aae7-5bc0-4805-9e9b-16c8db38a50d",
        "alarm": {
          "ID": "9b3575c1-7e38-4fe6-9fbf-6c742381abe2",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-03T11:00:00Z",
          "zone": {
            "ID": "75a02fa7-7049-4140-9fd1-079deaf0befa"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "7d2f4e54-c624-4024-b178-513e82c3b5be",
          "location": {
            "latitude": 52.11111,
            "longitude": 4.11111
          },
          "locationTimestamp": "2025-01-03T10:59:00Z",
          "name": "Mock Animal #3",
          "species": {
            "ID": "45aaed1c-55ce-4fcc-87bf-f508ca86ef54",
            "name": "Species C"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "c88afe30-838f-44ef-8fd0-6292573b28de",
          "activity": 3,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "9e0712af-3642-49ad-bf74-e5c7723ab4f4",
            "name": "Mock Experiment #3"
          },
          "name": "Mock Message #3",
          "severity": 1,
          "species": null,
          "text": "Message text #3",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-03T11:05:00Z",
        "user": {
          "ID": "6c03c54f-1825-4f8c-ae2f-47f5fd425b8e",
          "name": "User #3"
        }
      },
      {
        "ID": "c945f88d-5f63-49b4-bd82-c9a6340cf861",
        "alarm": {
          "ID": "a72f8a29-d0d0-4c2b-8c29-8c209caea280",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-01T09:00:00Z",
          "zone": {
            "ID": "3c891f08-5cc4-41ce-bd4a-6393ca9c9413"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "08a62197-172b-4d29-9f90-3b8f0864de15",
          "location": {
            "latitude": 51.12345,
            "longitude": 4.56789
          },
          "locationTimestamp": "2025-01-01T08:59:00Z",
          "name": "Mock Animal #1",
          "species": {
            "ID": "4baec58b-e54b-4ae8-a2b7-e513e84bc627",
            "name": "Species A"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "5f72adf3-361c-4b19-853b-a82062a1fa46",
          "activity": 1,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "7dfbe450-ab85-441a-a775-58bcbd39b091",
            "name": "Mock Experiment #1"
          },
          "name": "Mock Message #1",
          "severity": 2,
          "species": null,
          "text": "Message text #1",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-01T09:05:00Z",
        "user": {
          "ID": "a24a3cd9-7dba-4de6-b37c-37e356cb0606",
          "name": "User #1"
        }
      },
      {
        "ID": "e70f5fc1-f25e-45a1-a252-7bba39900f80",
        "alarm": {
          "ID": "843289be-b4cb-434b-a247-8587156b2ea0",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-02T10:00:00Z",
          "zone": {
            "ID": "d5e87361-bc39-44d0-b399-7491b2d7b47a"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "64fa91a3-4ffa-4245-b647-8b488171c079",
          "location": {
            "latitude": 50.98765,
            "longitude": 3.67890
          },
          "locationTimestamp": "2025-01-02T09:59:00Z",
          "name": "Mock Animal #2",
          "species": {
            "ID": "c47af21d-129c-4ccf-b6a0-16b15ed37ab6",
            "name": "Species B"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "f511d903-8e65-4cf4-9c7d-58de8d8955b6",
          "activity": 2,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "a29d64b3-7173-4d61-9fc9-f97a049a25b5",
            "name": "Mock Experiment #2"
          },
          "name": "Mock Message #2",
          "severity": 3,
          "species": null,
          "text": "Message text #2",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-02T10:05:00Z",
        "user": {
          "ID": "fc585537-2938-41e4-a4de-818e369573bd",
          "name": "User #2"
        }
      },
      {
        "ID": "db30aae7-5bc0-4805-9e9b-16c8db38a50d",
        "alarm": {
          "ID": "9b3575c1-7e38-4fe6-9fbf-6c742381abe2",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-03T11:00:00Z",
          "zone": {
            "ID": "75a02fa7-7049-4140-9fd1-079deaf0befa"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "7d2f4e54-c624-4024-b178-513e82c3b5be",
          "location": {
            "latitude": 52.11111,
            "longitude": 4.11111
          },
          "locationTimestamp": "2025-01-03T10:59:00Z",
          "name": "Mock Animal #3",
          "species": {
            "ID": "45aaed1c-55ce-4fcc-87bf-f508ca86ef54",
            "name": "Species C"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "c88afe30-838f-44ef-8fd0-6292573b28de",
          "activity": 3,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "9e0712af-3642-49ad-bf74-e5c7723ab4f4",
            "name": "Mock Experiment #3"
          },
          "name": "Mock Message #3",
          "severity": 1,
          "species": null,
          "text": "Message text #3",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-03T11:05:00Z",
        "user": {
          "ID": "6c03c54f-1825-4f8c-ae2f-47f5fd425b8e",
          "name": "User #3"
        }
      },
      {
        "ID": "c945f88d-5f63-49b4-bd82-c9a6340cf861",
        "alarm": {
          "ID": "a72f8a29-d0d0-4c2b-8c29-8c209caea280",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-01T09:00:00Z",
          "zone": {
            "ID": "3c891f08-5cc4-41ce-bd4a-6393ca9c9413"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "08a62197-172b-4d29-9f90-3b8f0864de15",
          "location": {
            "latitude": 51.12345,
            "longitude": 4.56789
          },
          "locationTimestamp": "2025-01-01T08:59:00Z",
          "name": "Mock Animal #1",
          "species": {
            "ID": "4baec58b-e54b-4ae8-a2b7-e513e84bc627",
            "name": "Species A"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "5f72adf3-361c-4b19-853b-a82062a1fa46",
          "activity": 1,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "7dfbe450-ab85-441a-a775-58bcbd39b091",
            "name": "Mock Experiment #1"
          },
          "name": "Mock Message #1",
          "severity": 2,
          "species": null,
          "text": "Message text #1",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-01T09:05:00Z",
        "user": {
          "ID": "a24a3cd9-7dba-4de6-b37c-37e356cb0606",
          "name": "User #1"
        }
      },
      {
        "ID": "e70f5fc1-f25e-45a1-a252-7bba39900f80",
        "alarm": {
          "ID": "843289be-b4cb-434b-a247-8587156b2ea0",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-02T10:00:00Z",
          "zone": {
            "ID": "d5e87361-bc39-44d0-b399-7491b2d7b47a"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "64fa91a3-4ffa-4245-b647-8b488171c079",
          "location": {
            "latitude": 50.98765,
            "longitude": 3.67890
          },
          "locationTimestamp": "2025-01-02T09:59:00Z",
          "name": "Mock Animal #2",
          "species": {
            "ID": "c47af21d-129c-4ccf-b6a0-16b15ed37ab6",
            "name": "Species B"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "f511d903-8e65-4cf4-9c7d-58de8d8955b6",
          "activity": 2,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "a29d64b3-7173-4d61-9fc9-f97a049a25b5",
            "name": "Mock Experiment #2"
          },
          "name": "Mock Message #2",
          "severity": 3,
          "species": null,
          "text": "Message text #2",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-02T10:05:00Z",
        "user": {
          "ID": "fc585537-2938-41e4-a4de-818e369573bd",
          "name": "User #2"
        }
      },
      {
        "ID": "db30aae7-5bc0-4805-9e9b-16c8db38a50d",
        "alarm": {
          "ID": "9b3575c1-7e38-4fe6-9fbf-6c742381abe2",
          "animal": null,
          "conveyances": null,
          "detection": null,
          "interaction": null,
          "timestamp": "2025-01-03T11:00:00Z",
          "zone": {
            "ID": "75a02fa7-7049-4140-9fd1-079deaf0befa"
          }
        },
        "animal": {
          "$schema": "https://example.com/schemas/Animal.json",
          "ID": "7d2f4e54-c624-4024-b178-513e82c3b5be",
          "location": {
            "latitude": 52.11111,
            "longitude": 4.11111
          },
          "locationTimestamp": "2025-01-03T10:59:00Z",
          "name": "Mock Animal #3",
          "species": {
            "ID": "45aaed1c-55ce-4fcc-87bf-f508ca86ef54",
            "name": "Species C"
          }
        },
        "message": {
          "$schema": "https://example.com/schemas/Message.json",
          "ID": "c88afe30-838f-44ef-8fd0-6292573b28de",
          "activity": 3,
          "answer": null,
          "encounterMeters": null,
          "encounterMinutes": null,
          "experiment": {
            "ID": "9e0712af-3642-49ad-bf74-e5c7723ab4f4",
            "name": "Mock Experiment #3"
          },
          "name": "Mock Message #3",
          "severity": 1,
          "species": null,
          "text": "Message text #3",
          "trigger": "alarm"
        },
        "response": null,
        "timestamp": "2025-01-03T11:05:00Z",
        "user": {
          "ID": "6c03c54f-1825-4f8c-ae2f-47f5fd425b8e",
          "name": "User #3"
        }
      }
    ];
  } catch (error) {
    console.error('Error fetching responses:', error);
    throw error;
  }
};
