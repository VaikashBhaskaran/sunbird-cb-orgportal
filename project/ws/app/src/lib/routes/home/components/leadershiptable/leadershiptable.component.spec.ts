import { LeadershiptableComponent } from './leadershiptable.component'
import { MdoInfoService } from '../../services/mdoinfo.service'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { ProfileV2UtillService } from '../../services/home-utill.service'
import { MatSnackBar } from '@angular/material/snack-bar'
import { MatDialog } from '@angular/material/dialog'
import { Router } from '@angular/router'
import { ActivatedRoute } from '@angular/router'
import { of } from 'rxjs'

jest.mock('@angular/material/dialog')
jest.mock('@angular/material/snack-bar')
jest.mock('@angular/router', () => ({
    Router: jest.fn().mockImplementation(() => ({
        navigate: jest.fn(),
    })),
    ActivatedRoute: jest.fn().mockImplementation(() => ({
        snapshot: { data: {} },
    })),
}))

describe('LeadershiptableComponent', () => {
    let component: LeadershiptableComponent
    let mockMdoInfoService: MdoInfoService
    let mockConfigService: ConfigurationsService
    let mockProfileUtilService: ProfileV2UtillService
    let mockSnackBar: MatSnackBar
    let mockDialog: MatDialog
    let mockRouter: Router

    beforeEach(() => {
        mockMdoInfoService = {
            // Each of these is subscribed to by the component.
            getAllUsers: jest.fn().mockReturnValue(of({ result: { response: { content: [], count: 0 } } })),
            getTeamUsers: jest.fn().mockReturnValue(of({ result: { response: { content: [], count: 0 } } })),
            assignTeamRole: jest.fn().mockReturnValue(of({})),
        } as unknown as MdoInfoService
        mockConfigService = { userProfile: { rootOrgId: '123' } } as unknown as ConfigurationsService
        // getUsers() runs each row's email through emailTransform; without it the error
        // escapes the subscription and leaves data empty.
        mockProfileUtilService = {
            emailTransform: jest.fn((email: string) => email)
        } as unknown as ProfileV2UtillService
        mockSnackBar = { open: jest.fn() } as unknown as MatSnackBar
        // The component calls dialogRef.afterClosed() on the result of open().
        mockDialog = { open: jest.fn().mockReturnValue({ afterClosed: () => of(undefined) }) } as unknown as MatDialog
        mockRouter = new Router()

        component = new LeadershiptableComponent(
            mockDialog,
            new ActivatedRoute(),
            mockSnackBar,
            mockMdoInfoService,
            mockConfigService,
            mockRouter,
            mockProfileUtilService
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should call getAllUsers when ngOnInit is called', () => {
        const getAllUsersSpy = jest.spyOn(component, 'getAllUsers')
        component.ngOnInit()
        expect(getAllUsersSpy).toHaveBeenCalledWith('123')
    })

    it('should handle data on ngOnChanges', () => {
        // ngOnChanges calls this.paginator.firstPage(); the ViewChild is not wired up when
        // the component is constructed directly.
        component.paginator = { firstPage: jest.fn() } as any
        const mockData = [{ id: '1', fullname: 'John Doe' }]
        component.ngOnChanges({
            data: {
                currentValue: mockData,
                previousValue: undefined,
                firstChange: false,
                isFirstChange: function (): boolean {
                    throw new Error('Function not implemented.')
                }
            }
        })
        expect(component.dataSource.data).toEqual(mockData)
        expect(component.length).toBe(1)
    })

    it('should open dialog and add user', () => {
        // adduser() only reaches assignRole when the dialog closes with data whose ids match
        // an entry in usersData.
        const openDialogSpy = jest.spyOn(mockDialog, 'open')
            .mockReturnValue({ afterClosed: () => of({ data: [{ id: '1' }] }) } as any)
        component.usersData = [{ id: '1', organisations: [{ roles: [] }] }]
        const assignRoleSpy = jest.spyOn(component, 'assignRole').mockImplementation(() => undefined)

        component.adduser()

        expect(openDialogSpy).toHaveBeenCalled()
        expect(assignRoleSpy).toHaveBeenCalled()
    })

    it('should assign role when assignRole is called', () => {
        const mockUser = { id: '1', organisations: [{ roles: [] }] }
        // organisationId on the request comes from component.deptID.
        component.deptID = '123'
        const assignTeamRoleSpy = jest.spyOn(mockMdoInfoService, 'assignTeamRole').mockReturnValue(of({}))
        component.assignRole(mockUser)
        expect(assignTeamRoleSpy).toHaveBeenCalledWith({
            request: {
                organisationId: '123',
                userId: '1',
                roles: ['MDO_LEADER'],
            },
        })
        expect(mockSnackBar.open).toHaveBeenCalledWith('User is added successfully!', 'X', { duration: 5000 })
    })

    it('should apply filter to the data source', () => {
        const filterValue = 'John'
        component.applyFilter(filterValue)
        expect(component.dataSource.filter).toBe(filterValue.toLowerCase())
    })

    it('should update data when updateData is called', () => {
        const mockRowData = { id: '1' }
        const navigateSpy = jest.spyOn(mockRouter, 'navigate')
        component.updateData(mockRowData)
        expect(navigateSpy).toHaveBeenCalledWith([`/app/users/${mockRowData.id}/details`], {
            queryParams: { param: 'MDOinfo', path: 'Leadership' },
        })
    })

    it('should handle getUsers correctly', () => {
        const mockResponse = { result: { response: { content: [{ firstName: 'John', email: 'john@example.com' }] } } }
        jest.spyOn(mockMdoInfoService, 'getTeamUsers').mockReturnValue(of(mockResponse))
        component.getUsers('MDO_LEADER')
        expect(component.usersData1).toEqual(mockResponse.result.response.content)
        expect(component.data.length).toBe(1)
        expect(component.data[0].fullname).toBe('John')
    })
})
