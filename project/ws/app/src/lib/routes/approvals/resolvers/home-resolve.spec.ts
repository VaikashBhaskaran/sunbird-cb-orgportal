
import { NeedApprovalsService } from '../services/need-approvals.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { of, throwError } from 'rxjs'
import { HomeResolve } from './home-resolve'

describe('HomeResolve', () => {
  let homeResolve: HomeResolve
  let needApprServiceMock: jest.Mocked<NeedApprovalsService>
  let configSvcMock: jest.Mocked<ConfigurationsService>

  beforeEach(() => {
    needApprServiceMock = {
      fetchProfileDeatils: jest.fn(),
    } as any

    configSvcMock = {
      userProfile: { userId: 'user123' }, // mock user profile
    } as any

    homeResolve = new HomeResolve(needApprServiceMock, configSvcMock)
  })

  it('should resolve profile details for "me" route', (done) => {
    // Arrange
    const routeMock = {
      routeConfig: { path: 'me' },
      params: {},
      queryParams: {},
    }
    const stateMock = {} as any

    const expectedResponse = { data: { profile: 'profileData' }, error: null }
    needApprServiceMock.fetchProfileDeatils.mockReturnValue(of({ profile: 'profileData' }))

    // Act
    homeResolve.resolve(routeMock as any, stateMock).subscribe((response) => {
      // Assert
      expect(response).toEqual(expectedResponse)
      done()
    })
  })

  it('should resolve profile details for a valid userId in route params', (done) => {
    // Arrange
    const routeMock = {
      routeConfig: { path: 'user/:userId' },
      params: { userId: 'user123' },
      queryParams: {},
    }
    const stateMock = {} as any

    const expectedResponse = { data: { profile: 'profileData' }, error: null }
    needApprServiceMock.fetchProfileDeatils.mockReturnValue(of({ profile: 'profileData' }))

    // Act
    homeResolve.resolve(routeMock as any, stateMock).subscribe((response) => {
      // Assert
      expect(response).toEqual(expectedResponse)
      expect(needApprServiceMock.fetchProfileDeatils).toHaveBeenCalledWith('user123')
      done()
    })
  })

  it('should resolve profile details when userId is not found in route params and is fetched from queryParams', (done) => {
    // Arrange
    const routeMock = {
      routeConfig: { path: 'user/:userId' },
      params: {},
      queryParams: { userId: 'userFromQuery' },
    }
    const stateMock = {} as any

    const expectedResponse = { data: { profile: 'profileData' }, error: null }
    needApprServiceMock.fetchProfileDeatils.mockReturnValue(of({ profile: 'profileData' }))

    // Act
    homeResolve.resolve(routeMock as any, stateMock).subscribe((response) => {
      // Assert
      expect(response).toEqual(expectedResponse)
      expect(needApprServiceMock.fetchProfileDeatils).toHaveBeenCalledWith('userFromQuery')
      done()
    })
  })

  it('should resolve profile details using default userId from config service when userId is not found', (done) => {
    // Arrange
    const routeMock = {
      routeConfig: { path: 'user/:userId' },
      params: {},
      queryParams: {},
    }
    const stateMock = {} as any

    const expectedResponse = { data: { profile: 'profileData' }, error: null }
    needApprServiceMock.fetchProfileDeatils.mockReturnValue(of({ profile: 'profileData' }))

    // Act
    homeResolve.resolve(routeMock as any, stateMock).subscribe((response) => {
      // Assert
      expect(response).toEqual(expectedResponse)
      expect(needApprServiceMock.fetchProfileDeatils).toHaveBeenCalledWith('user123')
      done()
    })
  })

  it('should handle error when fetchProfileDeatils fails', (done) => {
    // Arrange
    const routeMock = {
      routeConfig: { path: 'user/:userId' },
      params: { userId: 'user123' },
      queryParams: {},
    }
    const stateMock = {} as any

    // catchError passes the thrown value straight through as `error`, so the resolved
    // shape carries the Error itself rather than a plain object.
    const thrown = new Error('error')
    needApprServiceMock.fetchProfileDeatils.mockReturnValue(throwError(() => thrown))

    // Act
    homeResolve.resolve(routeMock as any, stateMock).subscribe((response) => {
      // Assert
      expect(response).toEqual({ error: thrown, data: null })
      done()
    })
  })
})
