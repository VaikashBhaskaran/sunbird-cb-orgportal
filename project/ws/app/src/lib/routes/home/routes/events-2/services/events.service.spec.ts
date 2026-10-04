import { HttpClient } from '@angular/common/http'
import { DatePipe } from '@angular/common'
import { of } from 'rxjs'
import { EventsService } from './events.service'

// Mock implementations
jest.mock('@angular/common/http')
jest.mock('@angular/common')
// Not lodash: the service relies on _.get's real behaviour (including its
// default-value argument), and an automock makes every lookup undefined.

// The endpoint constants in this service are relative ('apis/...'). They resolve to the
// same absolute path at runtime because index.html sets <base href="/">, but the
// assertions below have to match what the service actually passes to HttpClient.
describe('EventsService', () => {
  let service: EventsService
  let httpClient: jest.Mocked<HttpClient>
  let datePipe: jest.Mocked<DatePipe>

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks()

    // Setup mocks
    httpClient = {
      post: jest.fn(),
      get: jest.fn(),
      patch: jest.fn(),
    } as any

    datePipe = {
      transform: jest.fn(),
    } as any;

    // Create service instance
    service = new EventsService(httpClient, datePipe)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getEvents', () => {
    it('should fetch and format events', (done) => {
      // Mock data
      const mockRequest = {
        request: {
          filters: {
            status: ['Live']
          }
        }
      }
      const mockResponse = {
        result: {
          Event: [
            {
              startDate: '2023-01-01',
              createdOn: '2023-01-01',
              cancelledOn: '2023-01-01',
              submitedOn: '2023-01-01',
              publishedOn: '2023-01-01',
              rejectedOn: '2023-01-01',
              startDateTime: '2023-01-01T10:00:00Z'
            }
          ],
          count: 1
        }
      }

      // Mock datePipe transform
      datePipe.transform.mockReturnValue('01 Jan, 2023')

      // Mock http post
      httpClient.post.mockReturnValue(of(mockResponse))

      // Execute test
      service.getEvents(mockRequest, 'upcoming').subscribe(result => {
        // Verify http post was called with correct params
        expect(httpClient.post).toHaveBeenCalledWith('apis/proxies/v8/sunbirdigot/search', mockRequest)

        // Verify datePipe transformations
        expect(datePipe.transform).toHaveBeenCalledTimes(6)

        // Verify result format
        expect(result).toEqual({
          Event: [
            {
              startDate: '01 Jan, 2023',
              createdOn: '01 Jan, 2023',
              cancelledOn: '01 Jan, 2023',
              submitedOn: '01 Jan, 2023',
              publishedOn: '01 Jan, 2023',
              rejectedOn: '01 Jan, 2023',
              startDateTime: '2023-01-01T10:00:00Z',
              buttonsToHide: ['edit', 'cancel']
            }
          ],
          count: 1
        })
        done()
      })
    })

    it('should not add buttonsToHide for past events', (done) => {
      // Mock data
      const mockRequest = {
        request: {
          filters: {
            status: ['Live']
          }
        }
      }
      const mockResponse = {
        result: {
          Event: [
            {
              startDate: '2023-01-01',
              startDateTime: '2023-01-01T10:00:00Z'
            }
          ],
          count: 1
        }
      }

      // Mock datePipe transform
      datePipe.transform.mockReturnValue('01 Jan, 2023')

      // Mock http post
      httpClient.post.mockReturnValue(of(mockResponse))

      // Execute test
      service.getEvents(mockRequest, 'past').subscribe(result => {
        expect(result.Event[0].buttonsToHide).toBeUndefined()
        done()
      })
    })
  })

  describe('createContent', () => {
    it('should call the create content API', (done) => {
      const mockRequest = { name: 'testContent' }
      const mockResponse = { id: '123', status: 'success' }

      httpClient.post.mockReturnValue(of(mockResponse))

      service.createContent(mockRequest).subscribe(response => {
        expect(httpClient.post).toHaveBeenCalledWith('apis/proxies/v8/action/content/v3/create', mockRequest)
        expect(response).toEqual(mockResponse)
        done()
      })
    })
  })

  describe('uploadContent', () => {
    it('should call the upload content API', (done) => {
      const mockVal = '123'
      const mockFormData = new FormData()
      const mockResponse = { id: '123', status: 'success' }

      httpClient.post.mockReturnValue(of(mockResponse))

      service.uploadContent(mockVal, mockFormData).subscribe(response => {
        expect(httpClient.post).toHaveBeenCalledWith('apis/proxies/v8/upload/action/content/v3/upload/123', mockFormData)
        expect(response).toEqual(mockResponse)
        done()
      })
    })
  })

  describe('createEvent', () => {
    it('should call the create event API', (done) => {
      const mockRequest = { name: 'testEvent' }
      const mockResponse = { id: '123', status: 'success' }

      httpClient.post.mockReturnValue(of(mockResponse))

      service.createEvent(mockRequest).subscribe(response => {
        expect(httpClient.post).toHaveBeenCalledWith('apis/proxies/v8/event/v4/create', mockRequest)
        expect(response).toEqual(mockResponse)
        done()
      })
    })
  })

  describe('getEventDetailsByid', () => {
    it('should call the event details API', (done) => {
      const mockEventId = '123'
      const mockResponse = { id: '123', name: 'Test Event' }

      httpClient.get.mockReturnValue(of(mockResponse))

      // false picks the edit-mode read; true would hit the live EVENT_READ endpoint.
      service.getEventDetailsByid(mockEventId, false).subscribe(response => {
        expect(httpClient.get).toHaveBeenCalledWith('apis/proxies/v8/event/v4/read/123?mode=edit')
        expect(response).toEqual(mockResponse)
        done()
      })
    })
  })

  describe('updateEvent', () => {
    it('should call the update event API', (done) => {
      const mockEventId = '123'
      const mockFormBody = { name: 'Updated Event' }
      const mockResponse = { id: '123', status: 'success' }

      httpClient.patch.mockReturnValue(of(mockResponse))

      service.updateEvent(mockFormBody, mockEventId).subscribe(response => {
        expect(httpClient.patch).toHaveBeenCalledWith('apis/proxies/v8/event/v4/update/123', mockFormBody)
        expect(response).toEqual(mockResponse)
        done()
      })
    })
  })

  describe('publishEvent', () => {
    it('should call the publish event API', (done) => {
      const mockEventId = '123'
      const mockFormBody = { publish: true }
      const mockResponse = { id: '123', status: 'success' }

      httpClient.post.mockReturnValue(of(mockResponse))

      service.publishEvent(mockEventId, mockFormBody).subscribe(response => {
        expect(httpClient.post).toHaveBeenCalledWith('apis/proxies/v8/event/v4/publish/123', mockFormBody)
        expect(response).toEqual(mockResponse)
        done()
      })
    })
  })

  describe('convertToTreeView', () => {
    it('should convert competencies to tree view format', () => {
      const mockCompetencies = [
        {
          competencyAreaName: 'Area1',
          competencyAreaDescription: 'Description1',
          competencyAreaIdentifier: 'ID1',
          competencyAreaRefId: 'RefID1',
          competencyThemeDescription: 'ThemeDesc1',
          competencyThemeIdentifier: 'ThemeID1',
          competencyThemeName: 'Theme1',
          competencyThemeRefId: 'ThemeRefID1',
          competencyThemeType: 'Type1',
          competencyThemeAdditionalProperties: {
            displayName: 'DisplayName1',
            timeStamp: '123456789'
          },
          competencySubThemeDescription: 'SubThemeDesc1',
          competencySubThemeIdentifier: 'SubThemeID1',
          competencySubThemeName: 'SubTheme1',
          competencySubThemeRefId: 'SubThemeRefID1',
          competencySubThemeAdditionalProperties: {
            displayName: 'SubDisplayName1',
            timeStamp: '123456789'
          }
        },
        {
          competencyAreaName: 'Area1',
          competencyAreaDescription: 'Description1',
          competencyAreaIdentifier: 'ID1',
          competencyAreaRefId: 'RefID1',
          competencyThemeDescription: 'ThemeDesc1',
          competencyThemeIdentifier: 'ThemeID1',
          competencyThemeName: 'Theme1',
          competencyThemeRefId: 'ThemeRefID1',
          competencyThemeType: 'Type1',
          competencyThemeAdditionalProperties: {
            displayName: 'DisplayName1',
            timeStamp: '123456789'
          },
          competencySubThemeDescription: 'SubThemeDesc2',
          competencySubThemeIdentifier: 'SubThemeID2',
          competencySubThemeName: 'SubTheme2',
          competencySubThemeRefId: 'SubThemeRefID2',
          competencySubThemeAdditionalProperties: {
            displayName: 'SubDisplayName2',
            timeStamp: '123456789'
          }
        }
      ]

      const result = service.convertToTreeView(mockCompetencies)

      // Check that the result is as expected
      expect(result.length).toBe(1)
      expect(result[0].competencyAreaName).toBe('Area1')
      expect(result[0].themes.length).toBe(1)
      expect(result[0].themes[0].competencyThemeName).toBe('Theme1')
      expect(result[0].themes[0].subThems.length).toBe(2)
      expect(result[0].themes[0].subThems[0].competencySubThemeName).toBe('SubTheme1')
      expect(result[0].themes[0].subThems[1].competencySubThemeName).toBe('SubTheme2')
    })

    it('should handle multiple themes in the same area', () => {
      const mockCompetencies = [
        {
          competencyAreaName: 'Area1',
          competencyAreaDescription: 'Description1',
          competencyAreaIdentifier: 'ID1',
          competencyAreaRefId: 'RefID1',
          competencyThemeDescription: 'ThemeDesc1',
          competencyThemeIdentifier: 'ThemeID1',
          competencyThemeName: 'Theme1',
          competencyThemeRefId: 'ThemeRefID1',
          competencyThemeType: 'Type1',
          competencyThemeAdditionalProperties: {
            displayName: 'DisplayName1',
            timeStamp: '123456789'
          },
          competencySubThemeDescription: 'SubThemeDesc1',
          competencySubThemeIdentifier: 'SubThemeID1',
          competencySubThemeName: 'SubTheme1',
          competencySubThemeRefId: 'SubThemeRefID1',
          competencySubThemeAdditionalProperties: {
            displayName: 'SubDisplayName1',
            timeStamp: '123456789'
          }
        },
        {
          competencyAreaName: 'Area1',
          competencyAreaDescription: 'Description1',
          competencyAreaIdentifier: 'ID1',
          competencyAreaRefId: 'RefID1',
          competencyThemeDescription: 'ThemeDesc2',
          competencyThemeIdentifier: 'ThemeID2',
          competencyThemeName: 'Theme2',
          competencyThemeRefId: 'ThemeRefID2',
          competencyThemeType: 'Type2',
          competencyThemeAdditionalProperties: {
            displayName: 'DisplayName2',
            timeStamp: '123456789'
          },
          competencySubThemeDescription: 'SubThemeDesc3',
          competencySubThemeIdentifier: 'SubThemeID3',
          competencySubThemeName: 'SubTheme3',
          competencySubThemeRefId: 'SubThemeRefID3',
          competencySubThemeAdditionalProperties: {
            displayName: 'SubDisplayName3',
            timeStamp: '123456789'
          }
        }
      ]

      const result = service.convertToTreeView(mockCompetencies)

      expect(result.length).toBe(1)
      expect(result[0].themes.length).toBe(2)
      expect(result[0].themes[0].competencyThemeName).toBe('Theme1')
      expect(result[0].themes[1].competencyThemeName).toBe('Theme2')
    })
  })

  describe('convertToTabularView', () => {
    it('should convert tree view to tabular view', () => {
      const mockTreeView = [
        {
          competencyAreaDescription: 'Description1',
          competencyAreaIdentifier: 'ID1',
          competencyAreaName: 'Area1',
          competencyAreaRefId: 'RefID1',
          collapsed: true,
          themes: [
            {
              competencyThemeDescription: 'ThemeDesc1',
              competencyThemeIdentifier: 'ThemeID1',
              competencyThemeName: 'Theme1',
              competencyThemeRefId: 'ThemeRefID1',
              competencyThemeType: 'Type1',
              collapsed: true,
              competencyThemeAdditionalProperties: {
                displayName: 'DisplayName1',
                timeStamp: '123456789'
              },
              subThems: [
                {
                  competencySubThemeDescription: 'SubThemeDesc1',
                  competencySubThemeIdentifier: 'SubThemeID1',
                  competencySubThemeName: 'SubTheme1',
                  competencySubThemeRefId: 'SubThemeRefID1',
                  competencySubThemeAdditionalProperties: {
                    displayName: 'SubDisplayName1',
                    timeStamp: '123456789'
                  }
                },
                {
                  competencySubThemeDescription: 'SubThemeDesc2',
                  competencySubThemeIdentifier: 'SubThemeID2',
                  competencySubThemeName: 'SubTheme2',
                  competencySubThemeRefId: 'SubThemeRefID2',
                  competencySubThemeAdditionalProperties: {
                    displayName: 'SubDisplayName2',
                    timeStamp: '123456789'
                  }
                }
              ]
            }
          ]
        }
      ]

      const result = service.convertToTabularView(mockTreeView)

      expect(result.length).toBe(2)
      expect(result[0].competencyAreaName).toBe('Area1')
      expect(result[0].competencyThemeName).toBe('Theme1')
      expect(result[0].competencySubThemeName).toBe('SubTheme1')
      expect(result[1].competencyAreaName).toBe('Area1')
      expect(result[1].competencyThemeName).toBe('Theme1')
      expect(result[1].competencySubThemeName).toBe('SubTheme2')
    })
  })

  describe('generateThemeObj', () => {
    it('should generate theme object from input object', () => {
      const mockInput = {
        competencyThemeDescription: 'ThemeDesc1',
        competencyThemeIdentifier: 'ThemeID1',
        competencyThemeName: 'Theme1',
        competencyThemeRefId: 'ThemeRefID1',
        competencyThemeType: 'Type1',
        competencyThemeAdditionalProperties: {
          displayName: 'DisplayName1',
          timeStamp: '123456789'
        },
        competencySubThemeDescription: 'SubThemeDesc1',
        competencySubThemeIdentifier: 'SubThemeID1',
        competencySubThemeName: 'SubTheme1',
        competencySubThemeRefId: 'SubThemeRefID1',
        competencySubThemeAdditionalProperties: {
          displayName: 'SubDisplayName1',
          timeStamp: '123456789'
        }
      }

      const result = service.generateThemeObj(mockInput)

      expect(result.competencyThemeName).toBe('Theme1')
      expect(result.collapsed).toBe(true)
      expect(result.subThems.length).toBe(1)
      expect(result.subThems[0].competencySubThemeName).toBe('SubTheme1')
    })
  })

  describe('searchUser', () => {
    it('should call the search users API', (done) => {
      const mockValue = 'John'
      const mockRootOrgId = 'org123'
      const mockResponse = {
        result: {
          response: {
            content: [{ name: 'John Doe', id: 'user123' }]
          }
        }
      }

      httpClient.post.mockReturnValue(of(mockResponse))

      const expectedRequest = {
        request: {
          query: mockValue,
          filters: {
            rootOrgId: mockRootOrgId
          },
        },
      }

      service.searchUser(mockValue, mockRootOrgId).subscribe(response => {
        expect(httpClient.post).toHaveBeenCalledWith('apis/proxies/v8/user/v1/search', expectedRequest)
        expect(response).toEqual(mockResponse)
        done()
      })
    })
  })
})