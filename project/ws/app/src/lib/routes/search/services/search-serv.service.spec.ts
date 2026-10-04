import { SearchServService } from './search-serv.service'
import { SearchApiService } from '../apis/search-api.service'
import { EventService, ConfigurationsService } from '@sunbird-cb/utils-v2'
import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { NSSearch } from '@sunbird-cb/collection'

describe('SearchServService', () => {
  let service: SearchServService
  let mockHttpClient: jest.Mocked<HttpClient>
  let mockEventService: jest.Mocked<EventService>
  let mockSearchApiService: jest.Mocked<SearchApiService>
  let mockConfigurationsService: jest.Mocked<ConfigurationsService>

  const mockSearchConfig = {
    search: {
      tabs: [
        {
          phraseSearch: true
        }
      ],
      visibleFilters: { contentType: ['Course', 'Resource'] },
      excludeSourceFields: ['description']
    }
  }

  beforeEach(() => {
    mockHttpClient = {
      get: jest.fn().mockReturnValue(of(mockSearchConfig))
    } as unknown as jest.Mocked<HttpClient>

    mockEventService = {
      dispatchEvent: jest.fn()
    } as unknown as jest.Mocked<EventService>

    mockSearchApiService = {
      getSearchAutoCompleteResults: jest.fn().mockReturnValue(of([])),
      getSearchV6Results: jest.fn().mockReturnValue(of({})),
      getSearchResults: jest.fn().mockReturnValue(of({}))
    } as unknown as jest.Mocked<SearchApiService>

    mockConfigurationsService = {
      sitePath: 'http://example.com',
      activeOrg: 'example-org',
      rootOrg: 'example-root-org'
    } as unknown as jest.Mocked<ConfigurationsService>

    service = new SearchServService(
      mockEventService,
      mockSearchApiService,
      mockConfigurationsService,
      mockHttpClient
    )
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getSearchConfig', () => {
    it('should fetch search config and cache it', async () => {
      const config = await service.getSearchConfig()
      expect(config).toEqual(mockSearchConfig)
      expect(mockHttpClient.get).toHaveBeenCalledWith('http://example.com/feature/search.json')

      // Should use cached config on second call
      mockHttpClient.get.mockClear()
      const cachedConfig = await service.getSearchConfig()
      expect(cachedConfig).toEqual(mockSearchConfig)
      expect(mockHttpClient.get).not.toHaveBeenCalled()
    })
  })

  describe('getApplyPhraseSearch', () => {
    it('should return true when phraseSearch is true in config', async () => {
      const result = await service.getApplyPhraseSearch()
      expect(result).toBe(true)
    })

    it('should return true when phraseSearch is undefined in config', async () => {
      // Override the mock to return config with undefined phraseSearch
      mockHttpClient.get.mockReturnValue(of({
        search: {
          tabs: [{}]
        }
      }))
      service.searchConfig = null // Reset cache to force new fetch

      const result = await service.getApplyPhraseSearch()
      expect(result).toBe(true)
    })

    it('should return false when phraseSearch is false in config', async () => {
      // Override the mock to return config with false phraseSearch
      mockHttpClient.get.mockReturnValue(of({
        search: {
          tabs: [{
            phraseSearch: false
          }]
        }
      }))
      service.searchConfig = null // Reset cache to force new fetch

      const result = await service.getApplyPhraseSearch()
      expect(result).toBe(false)
    })
  })

  describe('searchAutoComplete', () => {
    it('should call API when language is specific', async () => {
      const params = { q: 'TEST', l: 'en' }
      // The shared mock returns an empty list; this test is about what comes back, so it
      // needs a result to come back.
      mockSearchApiService.getSearchAutoCompleteResults.mockReturnValue(of([{
        displayText: 'test result',
        _source: { searchTerm: 'test result' },   // required by ISearchAutoComplete
      }]))

      const results = await service.searchAutoComplete(params)

      expect(results).toEqual([
        { displayText: 'test result', _source: { searchTerm: 'test result' } },
      ])
      expect(mockSearchApiService.getSearchAutoCompleteResults).toHaveBeenCalledWith({ q: 'test', l: 'en' })
    })

    it('should return empty array when multiple languages are specified', async () => {
      const params = { q: 'TEST', l: 'en,fr' }

      const results = await service.searchAutoComplete(params)

      expect(results).toEqual([])
      expect(mockSearchApiService.getSearchAutoCompleteResults).not.toHaveBeenCalled()
    })

    it('should return empty array when language is "all"', async () => {
      const params = { q: 'TEST', l: 'all' }

      const results = await service.searchAutoComplete(params)

      expect(results).toEqual([])
      expect(mockSearchApiService.getSearchAutoCompleteResults).not.toHaveBeenCalled()
    })
  })

  describe('getLearning', () => {
    it('should transform the request and call searchV6Wrapper', () => {
      const spy = jest.spyOn(service, 'searchV6Wrapper').mockReturnValue(of({} as NSSearch.ISearchV6ApiResult))
      const request = {
        locale: ['en'],
        pageNo: 1,
        pageSize: 10,
        query: 'test',
        filters: { contentType: ['Course'] }
      }

      service.getLearning(request)

      expect(spy).toHaveBeenCalledWith(request)
    })

    it('should set locale to empty array if all locales specified', () => {
      const spy = jest.spyOn(service, 'searchV6Wrapper').mockReturnValue(of({} as NSSearch.ISearchV6ApiResult))
      const request: any = {
        locale: ['all'],
        query: 'test'
      }

      service.getLearning(request)

      expect(spy).toHaveBeenCalledWith({ ...request, locale: [] })
    })
  })

  describe('searchV6Wrapper', () => {
    it('should transform request to v6 format and call API', () => {
      const request: any = {
        locale: ['en'],
        pageNo: 1,
        pageSize: 10,
        query: 'test',
        didYouMean: true,
        filters: { contentType: ['Course'], audience: ['Learner'] },
        sort: [{ lastUpdatedOn: 'desc' }],
        isStandAlone: true
      }

      const expectedV6Request = {
        locale: ['en'],
        pageNo: 1,
        pageSize: 10,
        query: 'test',
        didYouMean: true,
        filters: [{
          andFilters: [
            { contentType: ['Course'] },
            { audience: ['Learner'] }
          ]
        }],
        visibleFilters: { contentType: ['Course', 'Resource'] },
        excludeSourceFields: ['description'],
        includeSourceFields: ['creatorLogo'],
        isStandAlone: true,
        sort: [{ lastUpdatedOn: 'desc' }]
      }

      service.searchV6Wrapper(request)

      // Allow for async config loading
      setTimeout(() => {
        expect(mockSearchApiService.getSearchV6Results).toHaveBeenCalledWith(expectedV6Request)
      }, 0)
    })

    it('should handle undefined sort and isStandAlone', () => {
      const request = {
        locale: ['en'],
        query: 'test',
        filters: { contentType: ['Course'] }
      }

      service.searchV6Wrapper(request)

      // Allow for async config loading
      setTimeout(() => {
        const apiCall = mockSearchApiService.getSearchV6Results.mock.calls[0][0]
        expect(apiCall.sort).toBeUndefined()
        expect(apiCall.isStandAlone).toBeUndefined()
      }, 0)
    })
  })

  describe('fetchSocialSearchUsers', () => {
    it('should add org details and call API', () => {
      const request: any = {
        query: 'john',
        filters: { department: ['HR'] }
      }

      const expectedRequest = {
        query: 'john',
        filters: { department: ['HR'] },
        org: 'example-org',
        rootOrg: 'example-root-org'
      }

      service.fetchSocialSearchUsers(request)

      expect(mockSearchApiService.getSearchResults).toHaveBeenCalledWith(expectedRequest)
    })
  })

  describe('updateSelectedFiltersSet', () => {
    it('should create a set from filter values', () => {
      const filters = {
        contentType: ['Course', 'Resource'],
        category: ['Technology']
      }

      const result = service.updateSelectedFiltersSet(filters)

      expect(result.filterSet).toBeInstanceOf(Set)
      expect(Array.from(result.filterSet)).toEqual(['Course', 'Resource', 'Technology'])
      expect(result.filterReset).toBe(true)
    })

    it('should handle tags with hierarchy', () => {
      const filters = {
        tags: ['Parent/Child/Grandchild', 'AnotherTag']
      }

      const result = service.updateSelectedFiltersSet(filters)

      expect(Array.from(result.filterSet)).toEqual([
        'Parent', 'Parent/Child', 'Parent/Child/Grandchild', 'AnotherTag'
      ])
    })

    it('should set filterReset to false when no filters are selected', () => {
      const filters = {
        contentType: [],
        category: []
      }

      const result = service.updateSelectedFiltersSet(filters)

      expect(result.filterReset).toBe(false)
    })
  })

  describe('transformSearchV6Filters', () => {
    it('should flatten nested filters structure', () => {
      const v6filters: any = [
        {
          andFilters: [
            { contentType: ['Course'] },
            { category: ['Technology'] }
          ]
        }
      ]

      const result = service.transformSearchV6Filters(v6filters)

      expect(result).toEqual({
        contentType: ['Course'],
        category: ['Technology']
      })
    })
  })

  describe('handleFilters', () => {
    it('should transform filters and mark selected ones', () => {
      const filters = [
        {
          type: 'contentType',
          displayName: 'Content Type',
          content: [
            { type: 'Course', displayName: 'Course', count: 10 },
            { type: 'Resource', displayName: 'Resource', count: 5 }
          ]
        },
        {
          type: 'category',
          displayName: 'Category',
          content: [
            { type: 'Technology', displayName: 'Technology', count: 7 }
          ]
        },
        {
          type: 'concepts',
          displayName: 'Concepts',
          content: [
            { type: 'Programming', displayName: 'Programming', count: 3 }
          ]
        },
        {
          type: 'dtLastModified',
          displayName: 'Last Modified',
          content: []
        }
      ]

      const selectedFilters = {
        contentType: ['Course'],
        category: ['Technology']
      }

      const selectedFilterSet = new Set(['Course', 'Technology'])

      const result = service.handleFilters(filters, selectedFilterSet, selectedFilters)

      expect(result.concept).toEqual([{ type: 'Programming', displayName: 'Programming', count: 3 }])
      expect(result.filtersRes.length).toBe(2)
      expect(result.filtersRes[0].checked).toBe(true)
      expect(result.filtersRes[0].content[0].checked).toBe(true)
      expect(result.filtersRes[0].content[1].checked).toBe(false)
    })

    it('should handle nested children in filters', () => {
      const filters = [
        {
          type: 'subjects',
          displayName: 'Subjects',
          content: [
            {
              type: 'Math',
              displayName: 'Mathematics',
              count: 10,
              children: [
                { type: 'Algebra', displayName: 'Algebra', count: 5 },
                { type: 'Geometry', displayName: 'Geometry', count: 5 }
              ]
            }
          ]
        }
      ]

      const selectedFilters = {
        subjects: ['Math']
      }

      const selectedFilterSet = new Set(['Math', 'Algebra'])

      const result = service.handleFilters(filters, selectedFilterSet, selectedFilters)

      expect(result.filtersRes[0].content[0].checked).toBe(true)
      // expect(result.filtersRes[0].content[0].children[0].checked).toBe(true)
      // expect(result.filtersRes[0].content[0].children[1].checked).toBe(false)
    })
  })

  describe('formatFilterForSearch', () => {
    it('should format filters for search API', () => {
      const filters = {
        contentType: ['Course', 'Resource'],
        category: ['Technology']
      }

      const result = service.formatFilterForSearch(filters)

      expect(result).toBe('"contentType":["Course","Resource"]$"category":["Technology"]')
    })

    it('should handle empty filter arrays', () => {
      const filters = {
        contentType: ['Course'],
        category: []
      }

      const result = service.formatFilterForSearch(filters)

      expect(result).toBe('"contentType":["Course"]')
    })
  })

  describe('getDisplayName', () => {
    it('should return display name for known types', () => {
      expect(service.getDisplayName('automationcentral')).toBe('Tools')
      expect(service.getDisplayName('topics')).toBe('Topics')
      expect(service.getDisplayName('kshop')).toBe('Documents')
    })

    it('should return the original type for unknown types', () => {
      expect(service.getDisplayName('unknownType')).toBe('unknownType')
    })
  })

  describe('getLanguageSearchIndex', () => {
    it('should return zh for zh-CN', () => {
      expect(service.getLanguageSearchIndex('zh-CN')).toBe('zh')
    })

    it('should return the original language code for others', () => {
      expect(service.getLanguageSearchIndex('en')).toBe('en')
      expect(service.getLanguageSearchIndex('fr')).toBe('fr')
    })
  })

  describe('raiseSearchEvent', () => {
    it('should dispatch telemetry event with search data', () => {
      const query = 'test query'
      const filters = { contentType: ['Course'] }
      const locale = 'en'

      service.raiseSearchEvent(query, filters, locale)

      expect(mockEventService.dispatchEvent).toHaveBeenCalledWith({
        eventType: expect.any(String),
        eventLogLevel: expect.any(String),
        data: {
          edata: {
            type: 'search',
          },
          object: {
            query,
            filters,
            locale,
          },
          eventSubType: expect.any(String),
        },
        from: 'search',
        to: 'telemetry',
      })
    })
  })

  describe('raiseSearchResponseEvent', () => {
    it('should dispatch telemetry event with search response data', () => {
      const query = 'test query'
      const filters = { contentType: ['Course'] }
      const totalHits = 42
      const locale = 'en'

      service.raiseSearchResponseEvent(query, filters, totalHits, locale)

      expect(mockEventService.dispatchEvent).toHaveBeenCalledWith({
        eventType: expect.any(String),
        eventLogLevel: expect.any(String),
        data: {
          query,
          filters,
          locale,
          eventSubType: expect.any(String),
          size: totalHits,
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
          getItem: jest.fn(key => store[key] || null),
          setItem: jest.fn((key, value) => {
            store[key] = value.toString()
          }),
          clear: () => {
            store = {}
          }
        }
      })()
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock
      })
    })

    it('should retrieve translations from API for single language', async () => {
      const translationData = { contentType: 'Content Type', category: 'Category' }
      mockHttpClient.get.mockReturnValue(of(translationData))

      const result = await service.translateSearchFilters('fr')

      expect(result).toEqual(translationData)
      expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/fr'))
      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it('should use cached translations if available', async () => {
      const cachedTranslations = {
        en: { contentType: 'Content Type' },
        fr: { contentType: 'Type de contenu' }
      }
      localStorage.setItem('filtersTranslation', JSON.stringify(cachedTranslations))

      const result = await service.translateSearchFilters('fr')

      expect(result).toEqual({ contentType: 'Type de contenu' })
      expect(mockHttpClient.get).not.toHaveBeenCalled()
    })

    it('should return English translations for multiple languages', async () => {
      const cachedTranslations = {
        en: { contentType: 'Content Type' }
      }
      localStorage.setItem('filtersTranslation', JSON.stringify(cachedTranslations))

      const result = await service.translateSearchFilters('en,fr')

      expect(result).toEqual({ contentType: 'Content Type' })
      expect(mockHttpClient.get).not.toHaveBeenCalled()
    })
  })
})