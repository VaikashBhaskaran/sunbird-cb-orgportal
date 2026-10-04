import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { ConfigurationsService, EventService } from '@sunbird-cb/utils-v2'
import { SearchApiService } from './search-api.service'
import { SearchServService } from './search-serv.service'

describe('SearchServService', () => {
  let service: SearchServService
  let httpClientMock: jest.Mocked<HttpClient>
  let eventServiceMock: jest.Mocked<EventService>
  let searchApiServiceMock: jest.Mocked<SearchApiService>
  let configServiceMock: jest.Mocked<ConfigurationsService>

  beforeEach(() => {
    // Create mock implementations
    httpClientMock = {
      get: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>

    eventServiceMock = {
      dispatchEvent: jest.fn(),
    } as unknown as jest.Mocked<EventService>

    searchApiServiceMock = {
      getSearch: jest.fn(),
      getSearchResults: jest.fn(),
    } as unknown as jest.Mocked<SearchApiService>

    configServiceMock = {
      sitePath: 'http://test.com',
      activeOrg: 'testOrg',
      rootOrg: 'testRootOrg',
    } as unknown as jest.Mocked<ConfigurationsService>

    // Initialize service with mocks
    service = new SearchServService(
      eventServiceMock,
      searchApiServiceMock,
      configServiceMock,
      httpClientMock,
    )
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getSearchConfig', () => {
    it('should fetch search config from http if not already loaded', async () => {
      const mockConfig = { search: { tabs: [{ phraseSearch: true }], visibleFiltersV2: { key1: {} } } }
      httpClientMock.get.mockReturnValue(of(mockConfig))

      const result = await service.getSearchConfig()

      expect(httpClientMock.get).toHaveBeenCalledWith('http://test.com/feature/search.json')
      expect(result).toEqual(mockConfig)
    })

    it('should return cached config if already loaded', async () => {
      const mockConfig = { search: { tabs: [{ phraseSearch: true }] } }
      httpClientMock.get.mockReturnValue(of(mockConfig))

      // First call should fetch from http
      await service.getSearchConfig()

      // Reset the mock to verify it's not called again
      httpClientMock.get.mockClear()

      // Second call should use cached value
      const result = await service.getSearchConfig()

      expect(httpClientMock.get).not.toHaveBeenCalled()
      expect(result).toEqual(mockConfig)
    })
  })

  describe('getApplyPhraseSearch', () => {
    it('should return true when phraseSearch is true', async () => {
      service.searchConfig = { search: { tabs: [{ phraseSearch: true }] } }

      const result = await service.getApplyPhraseSearch()

      expect(result).toBe(true)
    })

    it('should return true when phraseSearch is undefined', async () => {
      service.searchConfig = { search: { tabs: [{}] } }

      const result = await service.getApplyPhraseSearch()

      expect(result).toBe(true)
    })

    it('should return false when phraseSearch is false', async () => {
      service.searchConfig = { search: { tabs: [{ phraseSearch: false }] } }

      const result = await service.getApplyPhraseSearch()

      expect(result).toBe(false)
    })
  })

  describe('searchAutoComplete', () => {
    it('should convert query to lowercase and return empty array', async () => {
      const params = { q: 'TEST', l: 'all' }

      const result = await service.searchAutoComplete(params)

      expect(params.q).toBe('test')
      expect(result).toEqual([])
    })
  })

  describe('getLearning', () => {
    it('should call searchV6Wrapper with the request', () => {
      const request = { query: 'test', filters: {}, lastUpdatedOn: 'desc', fields: [] }
      const expectedResponse: any = { result: { count: 0, content: [] } }

      jest.spyOn(service, 'searchV6Wrapper').mockReturnValue(of(expectedResponse))

      let result
      service.getLearning(request).subscribe(res => {
        result = res
      })

      expect(service.searchV6Wrapper).toHaveBeenCalledWith(request)
      expect(result).toEqual(expectedResponse)
    })
  })

  describe('searchV6Wrapper', () => {
    beforeEach(() => {
      service.searchConfig = { search: { visibleFiltersV2: { key1: {}, key2: {} } } }
    })

    it('should transform request and call searchApi.getSearch', () => {
      const request = {
        query: 'test',
        filters: { type: ['doc'] },
        lastUpdatedOn: 'desc',
        fields: ['name', 'description']
      }

      const expectedV6Request = {
        request: {
          query: 'test',
          filters: { type: ['doc'] },
          sort_by: {
            lastUpdatedOn: 'desc',
          },
          facets: ['key1', 'key2'],
          fields: ['name', 'description'],
        }
      }

      const mockResponse = { result: { count: 1, content: [{ id: 'test1' }] } }
      searchApiServiceMock.getSearch.mockReturnValue(of(mockResponse))

      let result
      service.searchV6Wrapper(request).subscribe(res => {
        result = res
      })

      expect(searchApiServiceMock.getSearch).toHaveBeenCalledWith(expectedV6Request)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('fetchSocialSearchUsers', () => {
    it('should add org and rootOrg to request and call searchApi', () => {
      const request = { query: 'test' }
      const expectedRequest = {
        org: 'testOrg',
        rootOrg: 'testRootOrg',
        query: 'test'
      }

      const mockResponse = { result: [{ id: 'user1' }] }
      searchApiServiceMock.getSearchResults.mockReturnValue(of(mockResponse))

      let result
      service.fetchSocialSearchUsers(request).subscribe(res => {
        result = res
      })

      expect(searchApiServiceMock.getSearchResults).toHaveBeenCalledWith(expectedRequest)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('updateSelectedFiltersSet', () => {
    it('should convert filters to a Set and determine if filters are resetable', () => {
      const filters = {
        contentType: ['Course', 'Resource'],
        tags: ['tag1/subtag1', 'tag2']
      }

      const result = service.updateSelectedFiltersSet(filters)

      expect(result.filterReset).toBe(true)
      expect(result.filterSet.has('Course')).toBe(true)
      expect(result.filterSet.has('Resource')).toBe(true)
      expect(result.filterSet.has('tag1')).toBe(true)
      expect(result.filterSet.has('tag1/subtag1')).toBe(true)
      expect(result.filterSet.has('tag2')).toBe(true)
    })

    it('should return empty set and filterReset=false for empty filters', () => {
      const filters = {}

      const result = service.updateSelectedFiltersSet(filters)

      expect(result.filterReset).toBe(false)
      expect(result.filterSet.size).toBe(0)
    })
  })

  describe('transformSearchV6Filters', () => {
    it('should flatten andFilters into a single object', () => {
      const v6filters: any = [
        {
          andFilters: [
            { contentType: ['Course'] },
            { mimeType: ['application/pdf'] }
          ]
        },
        {
          andFilters: [
            { status: ['Live'] }
          ]
        }
      ]

      const result = service.transformSearchV6Filters(v6filters)

      expect(result).toEqual({
        contentType: ['Course'],
        mimeType: ['application/pdf'],
        status: ['Live']
      })
    })
  })

  describe('handleFilters', () => {
    it('should transform filters and identify which are checked based on selected filters', () => {
      const filters = [
        {
          type: 'contentType',
          content: [
            { type: 'Course', displayName: 'Course', count: 10 },
            { type: 'Resource', displayName: 'Resource', count: 5 }
          ]
        },
        {
          type: 'concepts',
          content: [
            { type: 'Concept1', displayName: 'Concept 1', count: 3 }
          ]
        }
      ]

      const selectedFilters = {
        contentType: ['Course']
      }

      const selectedFilterSet = new Set(['Course'])

      const result = service.handleFilters(filters, selectedFilterSet, selectedFilters)

      // Should extract concepts
      expect(result.concept).toEqual([{ type: 'Concept1', displayName: 'Concept 1', count: 3 }])

      // Should mark contentType filter as checked
      expect(result.filtersRes[0].checked).toBe(true)

      // Should mark Course as checked but not Resource
      expect(result.filtersRes[0].content[0].checked).toBe(true)
      expect(result.filtersRes[0].content[1].checked).toBe(false)
    })

    // The flag reads as a "hide" switch despite the name: LearningComponent passes true on
    // every route except learning, which is exactly where the contentType facet is dropped.
    it('should not include contentType filter when showContentType is true', () => {
      const filters = [
        {
          type: 'contentType',
          content: [
            { type: 'Course', displayName: 'Course', count: 10 }
          ]
        },
        {
          type: 'status',
          content: [
            { type: 'Live', displayName: 'Live', count: 5 }
          ]
        }
      ]

      const selectedFilterSet: any = new Set()
      const selectedFilters = {}

      const result = service.handleFilters(filters, selectedFilterSet, selectedFilters, true)

      // Only status filter should be included
      expect(result.filtersRes.length).toBe(1)
      expect(result.filtersRes[0].type).toBe('status')
    })
  })

  describe('raiseSearchEvent', () => {
    it('should dispatch a telemetry interact event', () => {
      const query = 'test'
      const filters = { contentType: ['Course'] }
      const locale = 'en'

      service.raiseSearchEvent(query, filters, locale)

      // These literals mirror the WsEvents enums the service uses: WsEventType.Telemetry,
      // WsEventLogLevel.Warn and EnumTelemetrySubType.Interact, all of which are
      // capitalised. Only `to`/`from` are plain strings in the service.
      expect(eventServiceMock.dispatchEvent).toHaveBeenCalledWith({
        eventType: 'Telemetry',
        eventLogLevel: 'Warn',
        data: {
          eventSubType: 'Interact',
          object: {
            query,
            filters,
            locale,
          },
          type: 'search',
        },
        from: 'search',
        to: 'telemetry',
      })
    })
  })

  describe('translateSearchFilters', () => {
    beforeEach(() => {
      // Mock localStorage
      const localStorageMock = (() => {
        let store: any = {}
        return {
          getItem: jest.fn((key) => store[key] || null),
          setItem: jest.fn((key, value) => {
            store[key] = value.toString()
          }),
          clear: jest.fn(() => {
            store = {}
          })
        }
      })()

      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      })
    })

    it('should return cached translation if available', async () => {
      const translations = {
        en: { contentType: 'Content Type' },
        all: {}
      }

      window.localStorage.setItem('filtersTranslation', JSON.stringify(translations))

      const result = await service.translateSearchFilters('en')

      expect(result).toEqual(translations.en)
      expect(httpClientMock.get).not.toHaveBeenCalled()
    })

    it('should fetch translation from API if not cached', async () => {
      window.localStorage.setItem('filtersTranslation', JSON.stringify(service.defaultFiltersTranslated))

      const mockTranslation = { contentType: 'Content Type' }
      httpClientMock.get.mockReturnValue(of(mockTranslation))

      const result = await service.translateSearchFilters('fr')

      expect(httpClientMock.get).toHaveBeenCalledWith('/apis/protected/v8/translate/filterdata/fr')
      expect(result).toEqual(mockTranslation)
    })

    it('should return English translation for multiple languages', async () => {
      const translations = {
        en: { contentType: 'Content Type' },
        all: {}
      }

      window.localStorage.setItem('filtersTranslation', JSON.stringify(translations))

      const result = await service.translateSearchFilters('en,fr')

      expect(result).toEqual(translations.en)
      expect(httpClientMock.get).not.toHaveBeenCalled()
    })
  })
})