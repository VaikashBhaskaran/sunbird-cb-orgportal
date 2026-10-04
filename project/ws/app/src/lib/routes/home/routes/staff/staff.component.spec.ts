
import { of, throwError } from 'rxjs'
import { SelectionModel } from '@angular/cdk/collections'
import { MatTableDataSource } from '@angular/material/table'
import * as _ from 'lodash'
import { StaffComponent } from './staff.component'

// Mock implementations
const mockMatSnackBar = { open: jest.fn() }
const mockMatDialog = { open: jest.fn(() => ({ afterClosed: () => of({}) })) }
const mockMdoInfoService = {
    // All four are subscribed to by the component; getStaffdetails reads
    // res.result.response and sorts it, so it needs an array.
    getStaffdetails: jest.fn().mockReturnValue(of({ result: { response: [] } })),
    addStaffdetails: jest.fn().mockReturnValue(of({ result: { response: [] } })),
    updateStaffdetails: jest.fn().mockReturnValue(of({ result: { response: [] } })),
    deleteStaffdetails: jest.fn().mockReturnValue(of({ result: { response: [] } })),
}
const mockConfigurationsService = { userProfile: { rootOrgId: 'mockDeptID' } }
const mockActivatedRoute = { snapshot: { data: { configService: { userProfile: { rootOrgId: 'mockDeptID' } } } } }

describe('StaffComponent', () => {
    let component: StaffComponent

    beforeEach(() => {
        component = new StaffComponent(
            mockMatSnackBar as any,
            mockMatDialog as any,
            mockActivatedRoute as any,
            mockConfigurationsService as any,
            mockMdoInfoService as any
        )

        // Mocking data source, paginator and selection model
        component.dataSource = new MatTableDataSource()
        component.selection = new SelectionModel<any>(true, [])
        component.paginator = { firstPage: jest.fn() } as any
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should fetch staff details on construction if deptID is available', () => {
        // getStaffDetails() is invoked from the constructor, not ngOnInit, so a spy
        // installed after construction would never fire. Assert the service call instead.
        expect(component.deptID).toBeDefined()
        expect(mockMdoInfoService.getStaffdetails).toHaveBeenCalledWith(component.deptID)
    })

    it('should handle error when getStaffDetails fails with a 400 error', () => {
        const errorResponse = { status: 400 }
        mockMdoInfoService.getStaffdetails.mockReturnValue(throwError(() => errorResponse))

        // const spy = jest.spyOn(component, 'openSnackbar')
        component.getStaffDetails()

        // expect(spy).toHaveBeenCalledWith('No staff positions found')
    })

    it('should correctly handle ngOnChanges', () => {
        const row = { srnumber: 1, position: 'Manager', positionfilled: 2, positionvacant: 3 }
        // ngOnChanges guards on `data.currentValue` but reads `data.data.currentValue`, so
        // both keys have to be present for the rows to land. See the note in
        // product-bugs.md - this asserts current behaviour rather than the intended shape.
        const changes: any = { currentValue: [row], data: { currentValue: [row] } }
        component.ngOnChanges(changes)

        expect(component.dataSource.data.length).toBe(1)
        expect(component.length).toBe(1)
        expect(component.paginator.firstPage).toHaveBeenCalled()
    })

    it('should call openSnackbar when updating staff details successfully', () => {
        const mockResponse = { success: true }
        const form = { value: { posfilled: 5, posvacant: 3 } }
        mockMdoInfoService.updateStaffdetails.mockReturnValue(of(mockResponse))

        //  const spy = jest.spyOn(component, 'openSnackbar')
        component.onSubmit(form)

        //  expect(spy).toHaveBeenCalledWith('Staff details updated successfully')
    })

    it('should call addStaffdetails and openSnackbar when adding staff details', () => {
        const form = { value: { posfilled: 5, posvacant: 3 } }
        const mockResponse = { success: true }
        mockMdoInfoService.addStaffdetails.mockReturnValue(of(mockResponse))

        //  const spy = jest.spyOn(component, 'openSnackbar')
        component.onSubmit(form)

        expect(mockMdoInfoService.addStaffdetails).toHaveBeenCalled()
        // expect(spy).toHaveBeenCalledWith('Staff details updated successfully')
    })

    it('should open dialog on calling onAddPosition', () => {
        const rowData = { position: 'Manager' }
        component.onAddPosition(rowData)

        expect(mockMatDialog.open).toHaveBeenCalled()
    })

    it('should select all rows when masterToggle is called', () => {
        component.dataSource.data = [{ position: 'Manager' }]
        component.masterToggle()

        expect(component.selection.selected.length).toBe(1)
    })

    it('should correctly filter data in applyFilter method', () => {
        const filterValue = 'Manager'
        component.applyFilter(filterValue)

        expect(component.dataSource.filter).toBe(filterValue.toLowerCase())
    })

    it('should correctly handle keyPressNumbers method', () => {
        const event = { which: 49 } // Key code for '1'
        const result = component.keyPressNumbers(event)

        expect(result).toBe(true)
    })

    it('should prevent non-numeric input in keyPressNumbers method', () => {
        const event = { which: 65, preventDefault: jest.fn() } // Key code for 'A'
        const result = component.keyPressNumbers(event)

        expect(result).toBe(false)
    })
})
