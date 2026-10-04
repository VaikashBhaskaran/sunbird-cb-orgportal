import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { SearchApiService } from './search-api.service' // Adjust the import path as needed

describe('SearchApiService', () => {
  let service: SearchApiService
  let httpClientMock: jest.Mocked<HttpClient>

  beforeEach(() => {
    // Create a mock for HttpClient
    httpClientMock = {
      post: jest.fn(),
      get: jest.fn(),
    } as unknown as jest.Mocked<HttpClient>

    // Initialize the service with the mock
    service = new SearchApiService(httpClientMock)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getSearchResults', () => {
    it('should call the social search endpoint with the provided request', () => {
      // Arrange
      const mockRequest = { query: 'test', filter: { someFilter: 'value' } }
      const mockResponse = { result: { content: [] } }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.getSearchResults(mockRequest).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/protected/v8/social/post/search',
        mockRequest
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getSearchAutoCompleteResults', () => {
    it('should call the autocomplete endpoint with the provided params', () => {
      // Arrange
      const mockParams = { q: 'test', l: 'en' }
      const mockResponse = [{ name: 'Test Result' }]
      httpClientMock.get.mockReturnValue(of(mockResponse))

      // Act
      let result: any[]
      service.getSearchAutoCompleteResults(mockParams).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.get).toHaveBeenCalledWith(
        '/apis/proxies/v8/sunbirdigot/read',
        { params: mockParams }
      )
      expect(result!).toEqual(mockResponse)
    })
  })

  describe('getSearchV6Results', () => {
    it('should transform the response with facets correctly', () => {
      // Arrange
      const mockRequest = { query: 'test' }
      const mockResponse = {
        result: {
          facets: [
            {
              name: 'contentType',
              values: [
                { name: 'Course', count: 10 },
                { name: 'Resource', count: 5 }
              ]
            }
          ]
        }
      }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.getSearchV6Results(mockRequest).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/sunbirdigot/search',
        mockRequest
      )
      expect(result.filters).toEqual([
        {
          displayName: 'contentType',
          type: 'contentType',
          content: [
            { displayName: 'Course', type: 'Course', count: 10, id: '' },
            { displayName: 'Resource', type: 'Resource', count: 5, id: '' }
          ]
        }
      ])
    })

    it('should handle catalogPaths filter appropriately', () => {
      // Arrange
      const mockRequest = { query: 'test' }
      const mockResponse = {
        result: {
          facets: [
            {
              name: 'catalogPaths',
              values: [
                {
                  name: 'Path1',
                  count: 10,
                  children: [
                    { name: 'Child1', count: 5 },
                    { name: 'Child2', count: 5 }
                  ]
                }
              ]
            }
          ]
        }
      }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.getSearchV6Results(mockRequest).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/sunbirdigot/search',
        mockRequest
      )
      // The facet mapping above keeps only displayName/type/count/id, so the `children`
      // the flattening step looks for are already gone and the catalogPaths facet
      // collapses to nothing. Recorded in product-bugs.md; asserted as it behaves.
      expect(result.filters[0].content).toEqual([])
    })

    it('should handle empty facets correctly', () => {
      // Arrange
      const mockRequest = { query: 'test' }
      const mockResponse = {
        result: {
          facets: []
        }
      }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.getSearchV6Results(mockRequest).subscribe(res => {
        result = res
      })

      // Assert
      expect(result.filters).toEqual([])
    })
  })

  describe('getSearch', () => {
    it('should call the search endpoint with the transformed request', () => {
      // Arrange
      const mockRequest = {
        request: {
          query: 'test search'
        }
      }
      const mockResponse = { result: { content: [] } }
      httpClientMock.post.mockReturnValue(of(mockResponse))

      // Act
      let result: any
      service.getSearch(mockRequest).subscribe(res => {
        result = res
      })

      // Assert
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/proxies/v8/sunbirdigot/read',
        {
          locale: ['en'],
          query: '',
          request: {
            query: 'test search',
            filters: {
              status: ['Draft', 'Live'],
              contentType: ['Collection', 'Course', 'Learning Path']
            },
            sort_by: {
              lastUpdatedOn: 'desc'
            },
            facets: ['primaryCategory', 'mimeType']
          }
        }
      )
      expect(result).toEqual(mockResponse)
    })
  })
})