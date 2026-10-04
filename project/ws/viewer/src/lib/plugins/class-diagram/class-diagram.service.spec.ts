import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { ClassDiagramService } from './class-diagram.service'
import { NSClassDiagram } from './class-diagram.model'

describe('ClassDiagramService', () => {
  let service: ClassDiagramService
  let httpClientMock: jest.Mocked<HttpClient>

  beforeEach(() => {
    httpClientMock = {
      post: jest.fn()
    } as any

    service = new ClassDiagramService(httpClientMock)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('should submit class diagram', (done) => {
    const mockIdentifier = 'test-identifier'
    const mockUserSolution = { someData: 'example' }
    // Both results are required on the response; the service only passes them through.
    const mockApiResponse = {
      submitResult: undefined,
      verifyResult: undefined
    } as unknown as NSClassDiagram.IClassDiagramApiResponse

    // Mock the http.post method to return an observable with mock response
    httpClientMock.post.mockReturnValue(of(mockApiResponse))

    service.submitClassDiagram({
      userSolution: mockUserSolution,
      identifier: mockIdentifier
    }).subscribe(response => {
      // Verify the response
      expect(response).toEqual(mockApiResponse)

      // Verify the http.post was called with correct parameters
      expect(httpClientMock.post).toHaveBeenCalledWith(
        `/apis/protected/v8/user/class-diagram/classdiagram/submit/${mockIdentifier}`,
        {
          user_solution: JSON.stringify({ options: mockUserSolution }),
          user_id_type: 'uuid',
          ignore_error: true
        }
      )

      done()
    })
  })
})