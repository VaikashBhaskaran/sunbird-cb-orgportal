
import { UsersService } from '../services/users.service'
import { of, throwError } from 'rxjs'
import { IResolveResponse } from '@sunbird-cb/utils-v2'
import { NSProfileDataV2 } from '../../home/models/profile-v2.model'
import { DepartmentResolve } from './department-resolve'

describe('DepartmentResolve', () => {
  let departmentResolve: DepartmentResolve
  let usersServiceMock: jest.Mocked<UsersService>

  beforeEach(() => {
    // Create a mock of UsersService
    usersServiceMock = {
      getMyDepartment: jest.fn(),
    } as any

    // Instantiate the DepartmentResolve service with the mocked UsersService
    departmentResolve = new DepartmentResolve(usersServiceMock)
  })

  it('should resolve with data when getMyDepartment returns success', (done) => {
    // Arrange: Mock the service method to return an observable with fake data
    const mockProfile: any = {
      id: '1',
      userId: '',
      interests: undefined,
      photo: undefined,
      osCreatedAt: '',
      osCreatedBy: '',
      osUpdatedAt: '',
      osUpdatedBy: '',
      osid: '',
      personalDetails: undefined,
      professionalDetails: [],
      skills: undefined
    }  // Adjust this to match the structure
    usersServiceMock.getMyDepartment.mockReturnValue(of(mockProfile))

    // Act: Call the resolve method
    departmentResolve.resolve({} as any, {} as any).subscribe((result: IResolveResponse<NSProfileDataV2.IProfile>) => {
      // Assert: Verify that the result is as expected
      expect(result.data).toEqual(mockProfile)
      expect(result.error).toBeNull()
      done()
    })
  })

  it('should handle error and return EMPTY when getMyDepartment fails', (done) => {
    // Arrange: Mock the service method to throw an error
    usersServiceMock.getMyDepartment.mockReturnValue(throwError('Error'))

    // Act: Call the resolve method. catchError swallows the failure into EMPTY, so the
    // stream completes without ever emitting - there is no value to assert on, only the
    // absence of one.
    let emitted = false
    departmentResolve.resolve({} as any, {} as any).subscribe({
      next: () => { emitted = true },
      complete: () => {
        expect(emitted).toBe(false)
        done()
      },
    })
  })
})
