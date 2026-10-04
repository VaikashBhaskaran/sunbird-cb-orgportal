import { SignupAutoComponent } from './signup-auto.component'
import { of, Subject, throwError } from 'rxjs'

// Mocking MatSnackBar, SignupAutoService, and ActivatedRoute
const mockSnackBar = {
    open: jest.fn()
}

const mockSignupAutoService = {
    signup: jest.fn()
}

const mockActivatedRoute = {
    paramMap: of({
        get: jest.fn().mockReturnValue('1234')
    })
}

describe('SignupAutoComponent', () => {
    let component: SignupAutoComponent

    beforeEach(() => {
        component = new SignupAutoComponent(
            mockSnackBar as any,
            mockSignupAutoService as any,
            mockActivatedRoute as any
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should call signup method on ngOnInit with the correct id', () => {
        const spySignup = jest.spyOn(component, 'signup')
        component.ngOnInit()
        expect(spySignup).toHaveBeenCalledWith('1234')
    })

    it('should set fetching to true when calling signup', () => {
        // A response that never arrives, so the flag is observed while the call is still
        // in flight - of() would emit synchronously and the handler would clear it again.
        mockSignupAutoService.signup.mockReturnValue(new Subject())
        component.signup('1234')
        expect(component.fetching).toBe(true)
    })

    it('should handle successful signup response', () => {
        const mockResponse = { msg: '1005:success', email: 'test@example.com' }
        mockSignupAutoService.signup.mockReturnValue(of(mockResponse))

        component.signup('1234')

        expect(component.fetching).toBe(false)
        // The message is a multi-line template literal in the component, so it carries the
        // newline and the source indentation.
        expect(component.msg).toBe(`You have been registered successfully on the platform with email test@example.com.
          Please check your email`)
        expect(component.showResonse).toBe(true)
        expect(mockSnackBar.open).toHaveBeenCalledWith(component.msg, 'X', { duration: 5000 })
    })

    it('should handle error response in signup method', () => {
        const mockError = { error: { msg: 'Some error occurred' } }
        mockSignupAutoService.signup.mockReturnValue(throwError(mockError))

        component.signup('1234')

        expect(component.fetching).toBe(false)
        expect(component.showResonse).toBe(true)
        expect(component.msg).toBe('Something went wrong please try again later!!')
        expect(mockSnackBar.open).toHaveBeenCalledWith('Some error occurred', 'X', { duration: 5000 })
    })

    it('should handle invalid response code', () => {
        const mockResponse = { msg: '9999:unknown error', email: 'test@example.com' }
        mockSignupAutoService.signup.mockReturnValue(of(mockResponse))

        component.signup('1234')

        expect(component.fetching).toBe(false)
        expect(component.msg).toBe('Something went wrong, please contact administrator')
        expect(component.showResonse).toBe(true)
        expect(mockSnackBar.open).toHaveBeenCalledWith(component.msg, 'X', { duration: 5000 })
    })
})
