import { ProfileViewComponent } from './profile-view.component'
import { BlendedApporvalService } from '../../services/blended-approval.service'
import { WidgetUserService } from '@sunbird-cb/collection'
import { MatDialog } from '@angular/material/dialog'
import { Router, ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'
import moment from 'moment'
import { ProfileCertificateDialogComponent } from '../profile-certificate-dialog/profile-certificate-dialog.component'

// Jest mocks
jest.mock('@angular/material/dialog')
jest.mock('../../services/blended-approval.service')
jest.mock('@sunbird-cb/collection')
jest.mock('@angular/router')

describe('ProfileViewComponent', () => {
    let component: ProfileViewComponent
    let bpServiceMock: jest.Mocked<BlendedApporvalService>
    let userSvcMock: jest.Mocked<WidgetUserService>
    let dialogMock: jest.Mocked<MatDialog>
    let routerMock: jest.Mocked<Router>
    let routeMock: jest.Mocked<ActivatedRoute>

    beforeEach(() => {
        // Manually mock the services
        bpServiceMock = {
            // The component subscribes to each of these.
            getUserById: jest.fn().mockReturnValue(of({ result: {} })),
            downloadCert: jest.fn().mockReturnValue(of({ result: { printUri: '' } })),
        } as unknown as jest.Mocked<BlendedApporvalService>

        userSvcMock = {
            // Result is iterated with forEach, so it must be an array.
            fetchUserBatchList: jest.fn().mockReturnValue(of([])),
        } as unknown as jest.Mocked<WidgetUserService>

        dialogMock = {
            open: jest.fn(),
        } as unknown as jest.Mocked<MatDialog>

        routerMock = {
            getCurrentNavigation: jest.fn(),
        } as unknown as jest.Mocked<Router>

        routeMock = {
            snapshot: {
                params: { userId: '123' },
                data: {
                    pageData: {
                        data: { tabs: [] },
                    },
                },
            } as any,
            // ngOnInit does `this.route.data.subscribe(...)`; without it the callback
            // throws part-way and the rest of the profile is never populated.
            data: of({}),
        } as unknown as jest.Mocked<ActivatedRoute>

        // Instantiate the component
        component = new ProfileViewComponent(
            dialogMock,
            routeMock,
            bpServiceMock,
            routerMock,
            userSvcMock,
        )
    })

    it('should create the ProfileViewComponent', () => {
        expect(component).toBeTruthy()
    })

    it('should fetch user data on init', () => {
        const userProfile = {
            profileDetails: {
                professionalDetails: [{ designation: 'Developer' }],
                academics: ['Math', 'Science'],
                interests: ['Reading'],
                verifiedKarmayogi: true,
            },
            firstName: 'John',
            email: 'john.doe@example.com',
            userId: '123',
            userName: 'john_doe',
        }

        // Mock the service responses to return observables
        bpServiceMock.getUserById.mockReturnValue(of(userProfile))
        userSvcMock.fetchUserBatchList.mockReturnValue(of([]))

        // ngOnInit() is empty on this component - the profile is fetched from the
        // constructor, so the instance has to be rebuilt after the mocks are set.
        component = new ProfileViewComponent(
            dialogMock,
            routeMock,
            bpServiceMock,
            routerMock,
            userSvcMock,
        )

        // Assertions after service calls
        // portalProfile is first set to the whole response and then reassigned to
        // res.profileDetails inside the route.data subscription.
        expect(component.portalProfile).toEqual(userProfile.profileDetails)
        expect(component.verifiedBadge).toBe(true)
        expect(component.academics).toEqual(userProfile.profileDetails.academics)
        expect(component.hobbies).toEqual(userProfile.profileDetails.interests)
    })

    it('should download all certificates correctly', () => {
        const mockCert = { identifier: 'cert123', issuedCertificates: [{ identifier: 'cert123' }] }
        const mockResponse = { result: { printUri: 'url_to_certificate' } }

        // Mock the services to return observables
        bpServiceMock.downloadCert.mockReturnValue(of(mockResponse))

        // Mock data for certification
        const mockData = [{ issuedCertificates: [mockCert] }]

        component.downloadAllCertificate(mockData)

        // Assert that downloadCert was called correctly
        expect(bpServiceMock.downloadCert).toHaveBeenCalledWith('cert123')
        expect(component.allCertificate).toEqual([
            {
                identifier: 'cert123',
                dataUrl: 'url_to_certificate',
                content: undefined,
                // The component pushes the iterated certificate itself (cid), which here
                // is mockCert - not its nested issuedCertificates entry.
                issuedCertificates: mockCert,
            },
        ])
    })

    it('should format date correctly in paDate method', () => {
        const date = '05-03-2025'
        const formattedDate = component.paDate(date)
        const expectedFormattedDate = moment(date, 'DD-MM-YYYY').toDate().toDateString()

        expect(formattedDate).toEqual(expectedFormattedDate)
    })

    it('should handle scroll and set sticky state', () => {
        component.elementPosition = 100

        // handleScroll reads window.pageYOffset, not scrollY, so set that.
        Object.defineProperty(window, 'pageYOffset', { value: 150, configurable: true })

        component.handleScroll()

        expect(component.sticky).toBe(true)

        // Scrolled back above elementPosition
        Object.defineProperty(window, 'pageYOffset', { value: 50, configurable: true })

        component.handleScroll()

        expect(component.sticky).toBe(false)
    })

    it('should open certificate dialog if issuedCertificates match identifier', () => {
        const mockItem = {
            issuedCertificates: [{ identifier: 'cert123' }],
            dataUrl: 'certificate_url',
        }

        component.openCertificateDialog(mockItem)

        expect(dialogMock.open).toHaveBeenCalledWith(ProfileCertificateDialogComponent, {
            autoFocus: false,
            data: { cet: 'certificate_url', value: mockItem },
        })
    })

    it('should not open certificate dialog if issuedCertificates do not match identifier', () => {
        // openCertificateDialog compares value.issuedCertificates.identifier - a property
        // of the array itself, so always undefined - against value.identifier. Give the item
        // a real identifier so the two genuinely differ; see product-bugs.md.
        const mockItem = {
            identifier: 'cert123',
            issuedCertificates: [{ identifier: 'cert456' }],
            dataUrl: 'certificate_url',
        }

        component.openCertificateDialog(mockItem)

        expect(dialogMock.open).not.toHaveBeenCalled()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })
})
