
import { HttpClient } from '@angular/common/http'
import { of, throwError } from 'rxjs'
import { CreateMDOService } from './create-mdo.services'

// Mock HttpClient class with necessary methods
class HttpClientMock {
  get = jest.fn();
  post = jest.fn();
  patch = jest.fn();
}

describe('CreateMDOService', () => {
  let service: CreateMDOService
  let httpClientMock: HttpClientMock

  beforeEach(() => {
    // Instantiate the mock HttpClient
    httpClientMock = new HttpClientMock()
    service = new CreateMDOService(httpClientMock as unknown as HttpClient) // Cast to HttpClient type
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  describe('getAllSubDepartments', () => {
    it('should call HttpClient.get and return departments data', () => {
      const deptName = 'department1'
      const mockResponse = { data: [] }

      // Mock the HttpClient.get method to return a successful response
      httpClientMock.get.mockReturnValue(of(mockResponse))

      service.getAllSubDepartments(deptName).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      // Verify if HttpClient.get was called with the correct URL
      expect(httpClientMock.get).toHaveBeenCalledWith('/apis/protected/v8/portal/departmentType/department1')
    })

    it('should handle error in getAllSubDepartments', () => {
      const deptName = 'department1'
      const errorResponse = new Error('Something went wrong')

      // Mock the HttpClient.get method to throw an error
      httpClientMock.get.mockReturnValue(throwError(errorResponse))

      service.getAllSubDepartments(deptName).subscribe(
        () => { },
        (error) => {
          expect(error).toEqual(errorResponse)
        }
      )
    })
  })

  describe('createDepartment', () => {
    it('should call HttpClient.post and create a department', () => {
      const deptData = { name: 'department1', head: 'headquarter', fileUpload: 'file' }
      const subDept: any = []
      const mockResponse = { success: true }

      // Mock the HttpClient.post method
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.createDepartment(deptData, subDept).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      // Verify the request body and the URL used for the POST request
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/apis/protected/v8/portal/spv/department',
        {
          rootOrg: 'igot',
          deptName: 'department1',
          deptTypeInfos: [],
          description: '',
          headquarters: 'headquarter',
          logo: 'file',
        }
      )
    })

    it('should handle error in createDepartment', () => {
      const deptData = { name: 'department1', head: 'headquarter', fileUpload: 'file' }
      const subDept: any = []
      const errorResponse = new Error('Something went wrong')

      // Mock the HttpClient.post method to throw an error
      httpClientMock.post.mockReturnValue(throwError(errorResponse))

      service.createDepartment(deptData, subDept).subscribe(
        () => { },
        (error) => {
          expect(error).toEqual(errorResponse)
        }
      )
    })
  })

  describe('updateDepartment', () => {
    it('should call HttpClient.patch and update a department', () => {
      const deptData = { name: 'department1', head: 'headquarter', fileUpload: 'file' }
      const updateId = 1
      const subDept: any = []
      const mockResponse = { success: true }

      // Mock the HttpClient.patch method
      httpClientMock.patch.mockReturnValue(of(mockResponse))

      service.updateDepartment(deptData, updateId, subDept).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      // Verify the request body and the URL used for the PATCH request
      expect(httpClientMock.patch).toHaveBeenCalledWith(
        '/apis/protected/v8/portal/spv/department',
        {
          id: updateId,
          rootOrg: 'igot',
          deptName: 'department1',
          deptTypeIds: [],
          description: '',
          headquarters: 'headquarter',
          logo: 'file',
        }
      )
    })

    it('should handle error in updateDepartment', () => {
      const deptData = { name: 'department1', head: 'headquarter', fileUpload: 'file' }
      const updateId = 1
      const subDept: any = []
      const errorResponse = new Error('Something went wrong')

      // Mock the HttpClient.patch method to throw an error
      httpClientMock.patch.mockReturnValue(throwError(errorResponse))

      service.updateDepartment(deptData, updateId, subDept).subscribe(
        () => { },
        (error) => {
          expect(error).toEqual(errorResponse)
        }
      )
    })
  })

  describe('assignAdminToDepartment', () => {
    it('should call HttpClient.post and assign admin to department', () => {
      const userId = '123'
      const deptId = '1'
      const deptRole = 'admin'
      const mockResponse = { success: true }

      // Mock the HttpClient.post method
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.assignAdminToDepartment(userId, deptId, deptRole).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      // Verify the request body and the URL used for the POST request
      expect(httpClientMock.post).toHaveBeenCalledWith(
        // Double slash: the ASSIGN_ADMIN_TO_CREATED_DEPARTMENT constant already ends in a
        // '/' and the call template adds another. Recorded in product-bugs.md.
        '/apis/protected/v8/portal/spv/deptAction//userrole',
        {
          userId,
          deptId,
          roles: [deptRole],
          isActive: true,
          isBlocked: false,
        }
      )
    })

    it('should handle error in assignAdminToDepartment', () => {
      const userId = '123'
      const deptId = '1'
      const deptRole = 'admin'
      const errorResponse = new Error('Something went wrong')

      // Mock the HttpClient.post method to throw an error
      httpClientMock.post.mockReturnValue(throwError(errorResponse))

      service.assignAdminToDepartment(userId, deptId, deptRole).subscribe(
        () => { },
        (error) => {
          expect(error).toEqual(errorResponse)
        }
      )
    })
  })

  describe('getDashboardData', () => {
    it('should call HttpClient.post and return dashboard data', () => {
      const url = 'test_url'
      const payload = { key: 'value' }
      const mockResponse = { success: true }

      // Mock the HttpClient.post method
      httpClientMock.post.mockReturnValue(of(mockResponse))

      service.getDashboardData(url, payload).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      // Verify the URL and payload used for the POST request
      expect(httpClientMock.post).toHaveBeenCalledWith(url, payload)
    })

    it('should handle error in getDashboardData', () => {
      const url = 'test_url'
      const payload = { key: 'value' }
      const errorResponse = new Error('Something went wrong')

      // Mock the HttpClient.post method to throw an error
      httpClientMock.post.mockReturnValue(throwError(errorResponse))

      service.getDashboardData(url, payload).subscribe(
        () => { },
        (error) => {
          expect(error).toEqual(errorResponse)
        }
      )
    })
  })
})
