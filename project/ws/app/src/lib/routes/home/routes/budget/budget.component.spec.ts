import { BudgetComponent } from './budget.component'
import { MatDialog } from '@angular/material/dialog'
import { MatSnackBar } from '@angular/material/snack-bar'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
import { MdoInfoService } from '../../services/mdoinfo.service'
import { ActivatedRoute } from '@angular/router'
import { of, throwError } from 'rxjs'

describe('BudgetComponent', () => {
    let component: BudgetComponent
    let mockDialog: jest.Mocked<MatDialog>
    let mockSnackBar: jest.Mocked<MatSnackBar>
    let mockConfigSvc: jest.Mocked<ConfigurationsService>
    let mockMdoInfoSrvc: jest.Mocked<MdoInfoService>
    let mockActivatedRoute: Partial<ActivatedRoute>
    let mockMatPaginator: any

    beforeEach(() => {
        // Create mocks
        mockDialog = {
            open: jest.fn().mockReturnValue({
                afterClosed: () => of({ data: null })
            })
        } as unknown as jest.Mocked<MatDialog>

        mockSnackBar = {
            open: jest.fn()
        } as unknown as jest.Mocked<MatSnackBar>

        mockConfigSvc = {
            userProfile: {
                rootOrgId: 'test-org-id'
            }
        } as unknown as jest.Mocked<ConfigurationsService>

        mockMdoInfoSrvc = {
            addBudgetdetails: jest.fn().mockReturnValue(of({ result: 'success' })),
            // mockImplementation, not mockReturnValue: getBudgetDetails splices the 'all'
            // row out of the response array, so a single shared payload would be consumed
            // by the constructor's call before any test ran.
            getBudgetdetails: jest.fn().mockImplementation(() => of({
                result: {
                    response: [
                        { schemeName: 'all', budgetYear: '2025-2026', salaryBudgetAllocated: 100, trainingBudgetAllocated: 200, trainingBudgetUtilization: 150, id: '1' },
                        { schemeName: 'Scheme 1', budgetYear: '2025-2026', salaryBudgetAllocated: 50, trainingBudgetAllocated: 100, trainingBudgetUtilization: 75, id: '2' }
                    ]
                }
            })),
            updateBudgetdetails: jest.fn().mockReturnValue(of({ result: 'success' }))
        } as unknown as jest.Mocked<MdoInfoService>

        mockActivatedRoute = {
            // The constructor falls back to this when configSvc.userProfile is absent.
            snapshot: {
                data: {
                    configService: {
                        userProfile: {
                            rootOrgId: 'test-org-id-from-route'
                        }
                    }
                }
            }
        } as any

        mockMatPaginator = {
            firstPage: jest.fn()
        }

        // Create component instance
        component = new BudgetComponent(
            mockSnackBar,
            mockDialog,
            mockConfigSvc,
            mockMdoInfoSrvc,
            mockActivatedRoute as ActivatedRoute
        )

        // Set paginator
        component.paginator = mockMatPaginator
    })

    it('should create', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize form group with required controls', () => {
        expect(component.budgetdata).toBeDefined()
        expect(component.budgetdata.get('budgetyear')).toBeDefined()
        expect(component.budgetdata.get('salarybudget')).toBeDefined()
        expect(component.budgetdata.get('trainingbudget')).toBeDefined()
        expect(component.budgetdata.get('budgetutilized')).toBeDefined()
    })

    it('should get budget years list', () => {
        const currentYear = new Date().getFullYear()
        // The constructor already calls getBudgetYearsList, and the method appends without
        // clearing, so start from an empty list to measure one run.
        component.yearsList = []
        component.getBudgetYearsList()

        expect(component.yearsList.length).toBe(3)
        expect(component.yearsList).toContain(`${currentYear - 1}-${currentYear}`)
        expect(component.yearsList).toContain(`${currentYear}-${currentYear + 1}`)
        expect(component.yearsList).toContain(`${currentYear + 1}-${currentYear + 2}`)
        expect(mockMdoInfoSrvc.getBudgetdetails).toHaveBeenCalledWith('test-org-id', `${currentYear}-${currentYear + 1}`)
    })

    it('should handle budget year change', () => {
        const event = { value: '2023-2024' }
        component.changeBudgetYear(event as any)

        expect(component.selectedYear).toBe('2023-2024')
        expect(mockMdoInfoSrvc.getBudgetdetails).toHaveBeenCalledWith('test-org-id', '2023-2024')
    })

    it('should handle ngOnChanges', () => {
        // The hook guards on `data.currentValue` but reads the value from
        // `data.data.currentValue`, so a real SimpleChanges never satisfies the guard and
        // the table is cleared instead of filled. The component also declares no @Input,
        // so Angular never calls this hook in the app. Recorded in product-bugs.md;
        // asserted here as the code actually behaves.
        const mockData = { currentValue: [{ id: 1, name: 'test' }] }
        component.ngOnChanges({ data: mockData as any })

        expect(component.dataSource.data).toEqual([])
        expect(mockMatPaginator.firstPage).toHaveBeenCalled()
    })

    it('should handle salary change', () => {
        component.trainingChange = 200
        component.onSalarayChange(100)

        expect(component.salarayChange).toBe(100)
        expect(component.totalbudget).toBe(300)
    })

    it('should handle training change', () => {
        component.salarayChange = 100
        component.onTrainingChange(200)

        expect(component.trainingChange).toBe(200)
        expect(component.totalbudget).toBe(300)
    })

    it('should handle utilized change when value is less than training and salary', () => {
        // onUtilizedChange takes the percentage branch only when the utilised amount is
        // below *both* allocations, so the salary allocation has to clear 150 as well.
        component.trainingChange = 200
        component.salarayChange = 200
        component.onUtilizedChange(150)

        expect(component.utilizedChange).toBe(150)
        expect(component.totalbudgetpercent).toBe('75.00')
        expect(component.utilizedChangeError).toBeFalsy()
    })

    it('should handle utilized change when value is more than training or salary', () => {
        component.trainingChange = 200
        component.salarayChange = 100
        component.onUtilizedChange(250)

        expect(component.utilizedChange).toBe(250)
        expect(component.utilizedChangeError).toBeTruthy()
    })

    it('should successfully get budget details', () => {
        component.deptID = 'test-org-id'
        component.getBudgetDetails('2025-2026')

        expect(mockMdoInfoSrvc.getBudgetdetails).toHaveBeenCalledWith('test-org-id', '2025-2026')
        expect(component.overallbudget).toBeDefined()
        expect(component.dataSource.data.length).toBe(1) // One scheme after 'all' is removed
        expect(component.budgetdata.get('budgetyear')?.value).toBe('2025-2026')
        expect(component.budgetdata.get('salarybudget')?.value).toBe(100)
        expect(component.budgetdata.get('trainingbudget')?.value).toBe(200)
        expect(component.budgetdata.get('budgetutilized')?.value).toBe(150)
    })

    it('should handle error in getBudgetDetails', () => {
        mockMdoInfoSrvc.getBudgetdetails = jest.fn().mockReturnValue(
            throwError({ status: 400 })
        )

        component.deptID = 'test-org-id'
        component.getBudgetDetails('2025-2026')

        expect(mockMdoInfoSrvc.getBudgetdetails).toHaveBeenCalledWith('test-org-id', '2025-2026')
        expect(component.budgetdata.get('salarybudget')?.value).toBe('')
        expect(component.budgetdata.get('trainingbudget')?.value).toBe('')
        expect(component.budgetdata.get('budgetutilized')?.value).toBe('')
        expect(component.totalbudgetpercent).toBe(0)
        expect(mockSnackBar.open).toHaveBeenCalledWith('No budget scheme found for this year')
    })

    it('should submit form and add budget details when overallbudget does not exist', () => {
        component.overallbudget = null
        component.deptID = 'test-org-id'

        const formValue = {
            value: {
                budgetyear: '2025-2026',
                salarybudget: '100',
                trainingbudget: '200',
                budgetutilized: '150'
            }
        }

        component.onSubmit(formValue)

        expect(mockMdoInfoSrvc.addBudgetdetails).toHaveBeenCalledWith({
            orgId: 'test-org-id',
            budgetYear: '2025-2026',
            schemeName: 'all',
            salaryBudgetAllocated: 100,
            trainingBudgetAllocated: 200,
            trainingBudgetUtilization: 150
        })
        expect(mockSnackBar.open).toHaveBeenCalledWith('Budget details added successfully')
        expect(mockMdoInfoSrvc.getBudgetdetails).toHaveBeenCalledWith('test-org-id', '2025-2026')
    })

    it('should submit form and update budget details when overallbudget exists', () => {
        component.overallbudget = { id: '1' }
        component.deptID = 'test-org-id'

        const formValue = {
            value: {
                budgetyear: '2025-2026',
                salarybudget: '100',
                trainingbudget: '200',
                budgetutilized: '150'
            }
        }

        component.onSubmit(formValue)

        expect(mockMdoInfoSrvc.updateBudgetdetails).toHaveBeenCalledWith({
            id: '1',
            orgId: 'test-org-id',
            budgetYear: '2025-2026',
            schemeName: 'all',
            trainingBudgetUtilization: 150
        })
        expect(mockSnackBar.open).toHaveBeenCalledWith('Budget details updated successfully')
        expect(mockMdoInfoSrvc.getBudgetdetails).toHaveBeenCalledWith('test-org-id', '2025-2026')
    })

    it('should update budget details', () => {
        const data = {
            id: '2',
            budgetyear: '2025-2026',
            schemename: 'Scheme 1',
            trainingBudgetUtilization: 80
        }

        component.deptID = 'test-org-id'
        component.updateBudgetDetails(data)

        expect(mockMdoInfoSrvc.updateBudgetdetails).toHaveBeenCalledWith({
            id: '2',
            orgId: 'test-org-id',
            budgetYear: '2025-2026',
            schemeName: 'Scheme 1',
            trainingBudgetUtilization: 80
        })
        expect(mockSnackBar.open).toHaveBeenCalledWith('Scheme details updated successfully')
        expect(mockMdoInfoSrvc.getBudgetdetails).toHaveBeenCalledWith('test-org-id', '2025-2026')
    })

    it('should apply filter', () => {
        component.applyFilter('test')
        expect(component.dataSource.filter).toBe('test')

        component.applyFilter('')
        expect(component.dataSource.filter).toBe('')
    })

    it('should open dialog for browse files', () => {
        component.browsefiles('tab1')

        expect(mockDialog.open).toHaveBeenCalled()
        // Check dialog config
        // const dialogConfig = mockDialog.open.mock.calls[0][1]
        // expect(dialogConfig.data).toEqual({ data: 'tab1' })
        // expect(dialogConfig.width).toBe('60%')
    })

    it('should validate keyPressNumbers to allow only numbers', () => {
        const validEvent = { which: 49, preventDefault: jest.fn() } // Key code for '1'
        const invalidEvent = { which: 65, preventDefault: jest.fn() } // Key code for 'A'

        expect(component.keyPressNumbers(validEvent)).toBeTruthy()
        expect(validEvent.preventDefault).not.toHaveBeenCalled()

        expect(component.keyPressNumbers(invalidEvent)).toBeFalsy()
        expect(invalidEvent.preventDefault).toHaveBeenCalled()
    })

    it('should open add scheme dialog and add new scheme', () => {
        mockDialog.open = jest.fn().mockReturnValue({
            afterClosed: () => of({
                data: {
                    budgetyear: '2025-2026',
                    schemename: 'New Scheme',
                    trainingBudgetUtilization: 50
                }
            })
        })

        component.deptID = 'test-org-id'
        component.budgetdata.get('trainingbudget')?.setValue(200)
        component.onaddScehme(null)

        // Check dialog opened
        expect(mockDialog.open).toHaveBeenCalled()

        // Check service called
        expect(mockMdoInfoSrvc.addBudgetdetails).toHaveBeenCalledWith({
            orgId: 'test-org-id',
            budgetYear: '2025-2026',
            schemeName: 'New Scheme',
            salaryBudgetAllocated: 0,
            trainingBudgetAllocated: 200,
            trainingBudgetUtilization: 50
        })

        // Check notifications and refresh
        expect(mockSnackBar.open).toHaveBeenCalledWith('Scheme details added successfully')
        expect(mockMdoInfoSrvc.getBudgetdetails).toHaveBeenCalled()
    })

    it('should open add scheme dialog and update existing scheme', () => {
        mockDialog.open = jest.fn().mockReturnValue({
            afterClosed: () => of({
                data: {
                    id: '2',
                    budgetyear: '2025-2026',
                    schemename: 'Scheme 1',
                    trainingBudgetUtilization: 80
                }
            })
        })

        const rowData = {
            id: '2',
            schemeName: 'Scheme 1',
            budgetYear: '2025-2026'
        }

        component.deptID = 'test-org-id'
        component.updateData(rowData)

        // Should call onaddScehme
        expect(mockDialog.open).toHaveBeenCalled()

        // Should call updateBudgetDetails
        expect(mockMdoInfoSrvc.updateBudgetdetails).toHaveBeenCalledWith({
            id: '2',
            orgId: 'test-org-id',
            budgetYear: '2025-2026',
            schemeName: 'Scheme 1',
            trainingBudgetUtilization: 80
        })
    })

    it('should initialize with rootOrgId from configSvc if available', () => {
        const component = new BudgetComponent(
            mockSnackBar,
            mockDialog,
            mockConfigSvc,
            mockMdoInfoSrvc,
            {} as ActivatedRoute
        )

        expect(component.deptID).toBe('test-org-id')
    })

    it('should initialize with rootOrgId from activeRoute if configSvc is not available', () => {
        mockConfigSvc.userProfile = null

        const component = new BudgetComponent(
            mockSnackBar,
            mockDialog,
            mockConfigSvc,
            mockMdoInfoSrvc,
            mockActivatedRoute as ActivatedRoute
        )

        expect(component.deptID).toBe('test-org-id-from-route')
    })

    it('should initialize displayedColumns in ngOnInit', () => {
        component.ngOnInit()
        expect(component.displayedColumns1).toBeDefined()
        expect(component.displayedColumns1).toEqual(component.scehemetableData.columns)
    })

    it('should get final columns with correct configuration', () => {
        // Test with all options enabled
        component.scehemetableData.needCheckBox = true
        component.scehemetableData.needHash = true
        component.scehemetableData.needUserMenus = true

        const columns = component.getFinalColumns()

        // Should include select, SR, all regular columns, and Menu
        expect(columns).toContain('select')
        expect(columns).toContain('SR')
        expect(columns).toContain('Menu')
        expect(columns).toContain('srnumber')
        expect(columns).toContain('schemeName')
    })
})
