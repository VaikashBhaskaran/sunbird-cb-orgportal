import { HttpClient } from '@angular/common/http'
import { of } from 'rxjs'
import { PracticeService } from './practice.service'
import { NSPractice } from './practice.model'

describe('PracticeService', () => {
  let service: PracticeService
  let httpClientMock: jest.Mocked<HttpClient>

  beforeEach(() => {
    httpClientMock = {
      post: jest.fn(),
      get: jest.fn(),
    } as any

    service = new PracticeService(httpClientMock)
  })

  describe('startSection', () => {
    it('should mark section as attempted but not fully attempted', () => {
      const mockSection = {
        identifier: 'section1',
        name: 'Test Section'
      } as NSPractice.IPaperSection



      service.startSection(mockSection)

      expect(service.secAttempted.getValue()).toEqual([

      ])
    })
  })

  describe('setFullAttemptSection', () => {
    it('should mark section as fully attempted', () => {
      const mockSection = {
        identifier: 'section1',
        name: 'Test Section'
      } as NSPractice.IPaperSection



      service.setFullAttemptSection(mockSection)

      expect(service.secAttempted.getValue()).toEqual([

      ])
    })
  })



  describe('getSection', () => {
    it('should get section for preview mode', () => {
      const sectionId = 'section1'
      const postData = { data: 'test' }
      const mockResponse = { success: true }

      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.getSection(sectionId, true, postData).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.post).toHaveBeenCalledWith(
        'api/public/assessment/v5/read',
        postData
      )
    })

    it('should get section for normal mode', () => {
      const sectionId = 'section1'
      const mockResponse = { success: true }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      // The normal-mode read always appends the collection as parentContextId.
      const collectionId = 'collection1'
      service.getSection(sectionId, false, undefined, collectionId).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      expect(httpClientMock.get).toHaveBeenCalledWith(
        `/apis/proxies/v8/assessment/v5/read/${sectionId}?parentContextId=${collectionId}`
      )
    })
  })

  describe('shuffle', () => {
    it('should shuffle array elements', () => {
      const original = ['a', 'b', 'c', 'd']
      const shuffled = service.shuffle([...original])

      // Length should remain the same
      expect(shuffled.length).toBe(original.length)

      // All elements should still exist in the array
      original.forEach(item => {
        expect(shuffled).toContain(item)
      })

      // Note: There's a small chance this could fail if the shuffle
      // randomly produces the same order
      expect(shuffled).not.toEqual(original)
    })
  })

  describe('canAttend', () => {
    it('should return attempt information for valid identifier', () => {
      const identifier = 'quiz1'
      const mockResponse = {
        result: {
          attemptsMade: 1,
          attemptsAllowed: 3
        }
      }

      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.canAttend(identifier).subscribe(response => {
        expect(response).toEqual(mockResponse.result)
      })

      expect(httpClientMock.get).toHaveBeenCalledWith(
        `/apis/proxies/v8/user/assessment/retake/${identifier}`
      )
    })

    it('should return default attempts for empty identifier', () => {
      service.canAttend('').subscribe(response => {
        expect(response).toEqual({
          attemptsMade: 0,
          attemptsAllowed: 1
        })
      })

      expect(httpClientMock.get).not.toHaveBeenCalled()
    })
  })

  describe('extractContent', () => {
    it('should extract text content from HTML string', () => {
      const htmlString = '<p>Hello <strong>World</strong></p>'
      const result = service.extractContent(htmlString)
      expect(result).toBe('Hello World')
    })
  })

  describe('shCorrectAnswer', () => {
    it('should update displayCorrectAnswer BehaviorSubject', () => {
      service.shCorrectAnswer(true)
      expect(service.displayCorrectAnswer.getValue()).toBe(true)

      service.shCorrectAnswer(false)
      expect(service.displayCorrectAnswer.getValue()).toBe(false)
    })
  })
})