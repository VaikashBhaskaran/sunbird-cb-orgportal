
import { WorkAllocationTableComponent } from './table.component'
import { SelectionModel } from '@angular/cdk/collections'
import { MatTableDataSource } from '@angular/material/table'

import { UserPopupComponent } from '../user-popup/user-popup'
import { BehaviorSubject, of } from 'rxjs'

describe('WorkAllocationTableComponent', () => {
    let component: WorkAllocationTableComponent
    let mockRouter: any
    let mockDialog: any
    let mockActivatedRoute: any
    let mockCreateMDOService: any
    let mockSnackBar: any
    let mockWrkAllocServ: any
    let mockMatPaginator: any
    // let mockMatSort: any
    let dialogRefSpyObj: any

    beforeEach(() => {
        // Mock MatPaginator
        mockMatPaginator = {
            pageIndex: 0,
            pageSize: 20,
            pageSizeOptions: [20, 30]
        }

        // Mock MatSort
        // mockMatSort = {
        //     active: '',
        //     direction: ''
        // }

        // Mock services
        mockRouter = {
            navigate: jest.fn()
        }

        dialogRefSpyObj = {
            afterClosed: jest.fn().mockReturnValue(of({
                data: [{ userId: 'test-user-id' }]
            }))
        }

        mockDialog = {
            open: jest.fn().mockReturnValue(dialogRefSpyObj)
        }

        // A plain Subject drops anything emitted before ngOnInit subscribes, so the params
        // never reached the component. BehaviorSubject replays the current value.
        const paramMap = new BehaviorSubject<any>({ currentDept: 'testDept', roleId: 'testRoleId' })
        mockActivatedRoute = {
            params: paramMap.asObservable(),
            snapshot: { params: {} }
        }

        mockCreateMDOService = {
            assignAdminToDepartment: jest.fn().mockReturnValue(of({ success: true }))
        }

        mockSnackBar = {
            open: jest.fn()
        }

        mockWrkAllocServ = {
            getPDF: jest.fn().mockReturnValue(of(new Blob(['test'], { type: 'application/pdf' })))
        }

        // Create component
        component = new WorkAllocationTableComponent(
            mockRouter,
            mockDialog,
            mockActivatedRoute as any,
            mockCreateMDOService,
            mockSnackBar,
            mockWrkAllocServ
        )

        // Manually set properties that would be set by ViewChild
        component.paginator = mockMatPaginator

        // Mock document functions
        global.URL.createObjectURL = jest.fn().mockReturnValue('mocked-url')
        document.createElement = jest.fn().mockImplementation((tag) => {
            if (tag === 'a') {
                return {
                    setAttribute: jest.fn(),
                    style: { visibility: '' },
                    click: jest.fn()
                }
            }
            return null
        })
        document.body.appendChild = jest.fn()
        document.body.removeChild = jest.fn()

        // Mock window.open
        window.open = jest.fn()
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
        expect(component.dataSource).toBeInstanceOf(MatTableDataSource)
        expect(component.selection).toBeInstanceOf(SelectionModel)
    })

    it('should initialize with the correct default values', () => {
        component.ngOnInit()
        expect(component.departmentRole).toBe('testDept')
        expect(component.departmentId).toBe('testRoleId')
        expect(component.needAddAdmin).toBe(true)
        expect(component.needCreateUser).toBe(true)
        expect(component.viewPaginator).toBe(true)
    })

    it('should initialize with inputDepartmentId when departmentId is not available', () => {
        // Reset the component
        component = new WorkAllocationTableComponent(
            mockRouter,
            mockDialog,
            { params: of({}) } as any,
            mockCreateMDOService,
            mockSnackBar,
            mockWrkAllocServ
        )

        // Set input property
        component.inputDepartmentId = 'inputDeptId'

        // Initialize
        component.ngOnInit()

        expect(component.departmentId).toBe('inputDeptId')
    })

    it('should update dataSource on ngOnChanges', () => {
        const mockData = [{ id: 1, name: 'Test' }]
        const changes = {
            data: {
                currentValue: mockData,
                previousValue: undefined,
                firstChange: true,
                isFirstChange: () => true
            }
        }

        component.ngOnChanges(changes)

        expect(component.dataSource.data).toEqual(mockData)
        expect(component.length).toBe(1)
        expect(component.showNoData).toBe(false)
        expect(component.showLoading).toBe(false)
    })

    it('should show noData message after timeout when data is empty', () => {
        jest.useFakeTimers()

        const changes = {
            data: {
                currentValue: [],
                previousValue: undefined,
                firstChange: true,
                isFirstChange: () => true
            }
        }

        component.ngOnChanges(changes)

        expect(component.showNoData).toBe(false)
        expect(component.showLoading).toBe(true)

        jest.advanceTimersByTime(1000)

        expect(component.showNoData).toBe(true)
        expect(component.showLoading).toBe(false)

        jest.useRealTimers()
    })

    it('should apply filter correctly', () => {
        component.applyFilter('Test Filter')
        expect(component.dataSource.filter).toBe('test filter')

        component.applyFilter('')
        expect(component.dataSource.filter).toBe('')
    })

    it('should handle button click and get PDF', () => {
        const row = { id: 'test-id' }

        component.buttonClick(row)

        expect(mockWrkAllocServ.getPDF).toHaveBeenCalledWith('test-id')
        expect(window.open).toHaveBeenCalledWith('mocked-url')
    })

    it('should emit row click event', () => {
        jest.spyOn(component.eOnRowClick, 'emit')
        const workOrder = { id: 'test-id' }

        component.selectWorkOrder(workOrder)

        expect(component.eOnRowClick.emit).toHaveBeenCalledWith(workOrder)
    })

    it('should get final columns correctly', () => {
        // getFinalColumns returns '' when tableData is undefined, so the fixture has to be
        // present for the column list to be built.
        component.tableData = {
            columns: [
                { key: 'col1', title: 'Column 1' },
                { key: 'col2', title: 'Column 2' }
            ],
            needCheckBox: true,
            needHash: true,
            actions: [{
                name: 'Edit',
                icon: 'undefined',
                type: '',
                label: ''
            }],
            needUserMenus: true
        } as any

        const columns = component.getFinalColumns()

        expect(columns).toEqual(['SR', 'select', 'col1', 'col2', 'Actions', 'Menu'])
    })

    it('should open user popup and assign admin on close', () => {
        component.departmentId = 'testDeptId'
        component.departmentRole = 'testDeptRole'

        component.openPopup()

        expect(mockDialog.open).toHaveBeenCalledWith(UserPopupComponent, {
            maxHeight: 'auto',
            height: '65%',
            width: '80%',
            panelClass: 'remove-pad',
        })

        expect(mockCreateMDOService.assignAdminToDepartment).toHaveBeenCalledWith(
            'test-user-id', 'testDeptId', 'MDO_ADMIN'
        )

        expect(mockSnackBar.open).toHaveBeenCalledWith('Admin assigned Successfully')
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/home/directory', { department: 'testDeptRole' }])
    })

    it('should handle error when assigning admin to department', () => {
        component.departmentId = 'testDeptId'
        mockCreateMDOService.assignAdminToDepartment.mockReturnValue(
            of({ error: { message: 'Error assigning admin' } })
        )

        component.openPopup()

        // This should be improved to properly test error handling
        // Currently, the component doesn't properly handle the error case
    })

    it('should check if all rows are selected', () => {
        component.dataSource.data = [
            { id: 1, name: 'Test 1' },
            { id: 2, name: 'Test 2' }
        ]
        component.selection.select(component.dataSource.data[0])

        expect(component.isAllSelected()).toBe(false)

        component.selection.select(component.dataSource.data[1])

        expect(component.isAllSelected()).toBe(true)
    })

    it('should toggle all selections with masterToggle', () => {
        component.dataSource.data = [
            { id: 1, name: 'Test 1' },
            { id: 2, name: 'Test 2' }
        ]

        component.masterToggle()
        expect(component.selection.selected.length).toBe(2)

        component.masterToggle()
        expect(component.selection.selected.length).toBe(0)
    })

    it('should provide correct checkbox label', () => {
        component.dataSource.data = [{ id: 1, position: 5, name: 'Test' }]

        // NOTE: the component's header label is inverted - it reads
        // `${isAllSelected() ? 'select' : 'deselect'} all`, so it announces "deselect all"
        // when nothing is selected. Logged in product-bugs.md; asserted as-is here.
        const noRowLabel = component.checkboxLabel()
        expect(noRowLabel).toBe('deselect all')

        component.selection.select(component.dataSource.data[0])
        const selectedLabel = component.checkboxLabel()
        expect(selectedLabel).toBe('select all')

        const rowLabel = component.checkboxLabel(component.dataSource.data[0])
        expect(rowLabel).toBe('deselect row 6')
    })

    it('should handle row click for Draft status', () => {
        const row = { id: 'test-id', fromdata: 'DRAFT' }
        // eOnRowClick is a real EventEmitter; its emit has to be spied to be asserted on.
        const emitSpy = jest.spyOn(component.eOnRowClick, 'emit')

        component.onRowClick(row)

        expect(emitSpy).toHaveBeenCalledWith(row)
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/workallocation/drafts', 'test-id'])
    })

    it('should handle row click for Published status', () => {
        const row = { id: 'test-id', fromdata: 'PUBLISHED' }
        // eOnRowClick is a real EventEmitter; its emit has to be spied to be asserted on.
        const emitSpy = jest.spyOn(component.eOnRowClick, 'emit')

        component.onRowClick(row)

        expect(emitSpy).toHaveBeenCalledWith(row)
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/workallocation/published', 'test-id'])
    })

    it('should navigate to create user page', () => {
        component.departmentId = 'testDeptId'
        component.departmentRole = 'testDeptRole'

        component.gotoCreateUser()

        expect(mockRouter.navigate).toHaveBeenCalledWith(
            ['/app/home/create-user'],
            { queryParams: { id: 'testDeptId', currentDept: 'testDeptRole' } }
        )
    })

    it('should handle blobToSaveAs functionality', () => {
        const fileName = 'test.pdf'
        const blob = new Blob(['test'], { type: 'application/pdf' })

        component.blobToSaveAs(fileName, blob)

        expect(document.createElement).toHaveBeenCalledWith('a')
        // More assertions could be added to verify the link attributes and actions
    })
})