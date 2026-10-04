import { BatchDetailsComponent } from './batch-details.component'
import { of, throwError } from 'rxjs'

describe('BatchDetailsComponent', () => {
    let component: BatchDetailsComponent
    let mockRouter: any
    let mockActiveRouter: any
    let mockBpService: any
    let mockSnackBar: any
    let mockEvents: any
    let mockDialogue: any
    let mockConfigSvc: any

    beforeEach(() => {
        // Mock router
        mockRouter = {
            getCurrentNavigation: jest.fn().mockReturnValue({
                extras: {
                    state: {
                        batchId: 'test-batch-123',
                        name: 'Test Batch',
                        batchAttributes: {
                            currentBatchSize: 50,
                            sessionDetails_v2: [{ id: 1, name: 'Session 1' }]
                        },
                        enrollmentEndDate: '2025-12-31'
                    }
                }
            }),
            navigate: jest.fn()
        }

        // Mock activated route
        mockActiveRouter = {
            parent: {
                snapshot: {
                    data: {
                        configService: {
                            unMappedUser: {
                                userId: 'test-user-123',
                                rootOrgId: 'test-org-123',
                                rootOrg: {
                                    orgName: 'Test Org',
                                    orgId: 'test-org-123'
                                },
                                channel: 'test-channel'
                            }
                        }
                    }
                }
            },
            snapshot: {
                params: {
                    id: 'test-program-123',
                    batchid: 'test-batch-123'
                }
            }
        }

        // Mock blended approval service
        mockBpService = {
            // listReports awaits this; the report list is empty by default.
            listBpReports: jest.fn().mockReturnValue(of({ result: { content: [] } })),
            getBpConsumptionReportStatusApi: jest.fn().mockReturnValue(of({ result: {} })),
            generateBpConsumptionReport: jest.fn().mockReturnValue(of({ params: { status: 'success' } })),
            downloadReport: jest.fn().mockReturnValue(of(new Blob())),
            getBlendedProgramsDetails: jest.fn().mockReturnValue(of({
                result: {
                    content: {
                        identifier: 'test-program-123',
                        name: 'Test Program',
                        wfApprovalType: 'ONE_STEP_MDO',
                        wfSurveyLink: 'https://test.com/survey/123',
                        batches: [{
                            batchId: 'test-batch-123',
                            name: 'Test Batch'
                        }]
                    }
                }
            })),
            getUserById: jest.fn().mockReturnValue(of({
                userId: 'test-user-123',
                roles: ['MDO_ADMIN'],
                rootOrgId: 'test-org-123'
            })),
            getRequests: jest.fn().mockReturnValue(of({
                result: {
                    data: [
                        {
                            userInfo: { first_name: 'Test User 1' },
                            wfInfo: [{ lastUpdatedOn: '2025-01-01T00:00:00Z', deptName: 'Test Dept' }]
                        }
                    ]
                }
            })),
            getSerchRequests: jest.fn().mockReturnValue(of({
                result: {
                    data: [
                        {
                            userInfo: { first_name: 'Test User 1' },
                            wfInfo: [{
                                lastUpdatedOn: '2025-01-01T00:00:00Z',
                                deptName: 'Test Dept',
                                currentStatus: 'SEND_FOR_MDO_APPROVAL'
                            }]
                        }
                    ]
                }
            })),
            getLearners: jest.fn().mockReturnValue(of([
                { user_id: 'test-user-123', first_name: 'Test User', department: 'Test Dept' }
            ])),
            getLearnersWithoutOrg: jest.fn().mockReturnValue(of([
                { user_id: 'test-user-123', first_name: 'Test User', department: 'Test Dept' }
            ])),
            updateBlendedRequests: jest.fn().mockReturnValue(of({ success: true })),
            removeLearner: jest.fn().mockReturnValue(of({ success: true })),
            getBpReportStatusApi: jest.fn().mockReturnValue(of({
                result: {
                    content: [{
                        lastReportGeneratedOn: '2025-01-01T00:00:00Z',
                        status: 'COMPLETED',
                        downloadLink: 'https://test.com/gcpbpreports/report.xlsx'
                    }]
                }
            })),
            generateBpReport: jest.fn().mockReturnValue(of({
                params: { status: 'SUCCESS' }
            })),
            downloadReports: jest.fn().mockResolvedValue(true)
        }

        // Mock snackbar
        mockSnackBar = {
            open: jest.fn()
        }

        // Mock event service
        mockEvents = {
            raiseInteractTelemetry: jest.fn()
        }

        // Mock dialogue
        mockDialogue = {
            open: jest.fn().mockReturnValue({
                afterClosed: jest.fn().mockReturnValue(of('done'))
            })
        }

        // Mock config service
        mockConfigSvc = {}

        // Create component instance
        component = new BatchDetailsComponent(
            mockRouter,
            mockActiveRouter,
            mockBpService,
            mockSnackBar,
            mockEvents,
            mockDialogue,
            mockConfigSvc
        )
    })

    it('should create the component', () => {
        expect(component).toBeTruthy()
    })

    it('should initialize with correct values', async () => {
        jest.spyOn(component, 'getNewRequestsList').mockImplementation()
        await component.ngOnInit()

        expect(component.programID).toBe('test-program-123')
        expect(component.batchID).toBe('test-batch-123')
        expect(component.userDetails).toBeDefined()
        expect(mockBpService.getUserById).toHaveBeenCalled()
    })

    it('should get program details successfully', () => {
        jest.spyOn(component, 'getNewRequestsList').mockImplementation()
        component.getBPDetails('test-program-123')

        expect(mockBpService.getBlendedProgramsDetails).toHaveBeenCalledWith('test-program-123')
        expect(component.programData).toBeDefined()
        expect(component.checkSurveyLink).toBe(true)
        expect(component.breadcrumbs).toBeDefined()
        expect(component.getNewRequestsList).toHaveBeenCalled()
    })

    describe('filter method', () => {
        beforeEach(() => {
            // filter('reportStatus') reaches listReports, which reads the signed-in user's
            // roles; ngOnInit is what normally fetches them.
            component.userDetails = { roles: ['MDO_ADMIN'] }
        })

        it('should set currentFilter to pending and call getNewRequestsList', () => {
            jest.spyOn(component, 'getNewRequestsList').mockImplementation()
            component.filter('pending')

            expect(component.currentFilter).toBe('pending')
            expect(component.getNewRequestsList).toHaveBeenCalled()
            expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
        })

        it('should set currentFilter to approved and call getLearnersList', () => {
            jest.spyOn(component, 'getLearnersList').mockImplementation()
            component.filter('approved')

            expect(component.currentFilter).toBe('approved')
            expect(component.getLearnersList).toHaveBeenCalled()
            expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
        })

        it('should set currentFilter to rejected and call getRejectedList', () => {
            jest.spyOn(component, 'getRejectedList').mockImplementation()
            component.filter('rejected')

            expect(component.currentFilter).toBe('rejected')
            expect(component.getRejectedList).toHaveBeenCalled()
            expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
        })

        it('should set currentFilter to sessions and call getSessionDetails', () => {
            jest.spyOn(component, 'getSessionDetails').mockImplementation()
            component.filter('sessions')

            expect(component.currentFilter).toBe('sessions')
            expect(component.getSessionDetails).toHaveBeenCalled()
            expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
        })

        it('should set currentFilter to approvalStatus and call getApprovalStatusList', () => {
            jest.spyOn(component, 'getApprovalStatusList').mockImplementation()
            component.filter('approvalStatus')

            expect(component.currentFilter).toBe('approvalStatus')
            expect(component.getApprovalStatusList).toHaveBeenCalled()
            expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
        })

        it('should set currentFilter to reportStatus and list the reports', () => {
            // The reportStatus tab goes through listReports now, not getBpReportStatus.
            jest.spyOn(component, 'listReports').mockImplementation()
            component.filter('reportStatus')

            expect(component.currentFilter).toBe('reportStatus')
            expect(component.listReports).toHaveBeenCalled()
            expect(mockEvents.raiseInteractTelemetry).toHaveBeenCalled()
        })
    })

    it('should get users count', async () => {
        component.batchData = {
            batchId: 'test-batch-123'
        }

        const result = await component.getUsersCount()

        expect(mockBpService.getSerchRequests).toHaveBeenCalled()
        expect(result).toEqual({
            enrolled: 0,
            totalApplied: 1,
            rejected: 0
        })
    })

    it('should get learners list', () => {
        jest.spyOn(component, 'getAllLearner').mockImplementation()
        component.batchData = {
            batchId: 'test-batch-123'
        }

        component.getLearnersList()

        expect(mockBpService.getLearners).toHaveBeenCalledWith('test-batch-123', 'test-channel')
        expect(component.approvedUsers.length).toBe(1)
        expect(component.clonedApprovedUsers.length).toBe(1)
        expect(component.getAllLearner).toHaveBeenCalled()
    })

    it('should get new requests list', () => {
        jest.spyOn(component, 'getAllLearner').mockImplementation()
        component.batchData = {
            batchId: 'test-batch-123'
        }

        component.getNewRequestsList()

        expect(mockBpService.getRequests).toHaveBeenCalled()
        expect(component.newUsers.length).toBe(1)
        expect(component.clonedNewUsers.length).toBe(1)
        expect(component.getAllLearner).toHaveBeenCalled()
    })

    it('should handle request approval', () => {
        jest.spyOn(component, 'getNewRequestsList').mockImplementation()
        // spyOn(component, 'requestMesages').mockReturnValue('Request is approved successfully!')

        component.programData = {
            wfApprovalType: 'ONE_STEP_MDO'
        }

        const eventData = {
            action: 'Approve',
            userData: {
                userInfo: { first_name: 'Test User' },
                wfInfo: [{
                    wfId: 'wf-123',
                    applicationId: 'app-123',
                    userId: 'user-123',
                    actorUUID: 'actor-123',
                    rootOrg: 'org-123',
                    deptName: 'Test Dept',
                    lastUpdatedOn: '2025-01-01T00:00:00Z'
                }]
            },
            comment: 'Approved'
        }

        component.onSubmit(eventData)

        expect(mockBpService.updateBlendedRequests).toHaveBeenCalled()
        expect(component.showUserDetails).toBe(false)
        expect(mockSnackBar.open).toHaveBeenCalled()
        expect(component.getNewRequestsList).toHaveBeenCalled()
    })

    it('should handle approval update error', () => {
        mockBpService.updateBlendedRequests.mockReturnValue(throwError({
            error: { params: { errmsg: 'Test error' } }
        }))

        const eventData = {
            action: 'Approve',
            userData: {
                userInfo: { first_name: 'Test User' },
                wfInfo: [{
                    wfId: 'wf-123',
                    applicationId: 'app-123',
                    userId: 'user-123',
                    actorUUID: 'actor-123',
                    rootOrg: 'org-123',
                    deptName: 'Test Dept',
                    lastUpdatedOn: '2025-01-01T00:00:00Z'
                }]
            },
            comment: 'Approved'
        }

        component.onSubmit(eventData)

        expect(mockBpService.updateBlendedRequests).toHaveBeenCalled()
        expect(mockSnackBar.open).toHaveBeenCalledWith('Test error', 'X', { duration: 5000 })
    })

    it('should remove a learner', () => {
        jest.spyOn(component, 'filter').mockImplementation()
        jest.spyOn(component, 'getLearnersList').mockImplementation()

        const eventData = {
            action: 'Remove',
            userData: {
                user_id: 'user-123',
                first_name: 'Test User',
                department: 'Test Dept'
            },
            comment: 'Removed'
        }

        component.removeUser(eventData)

        expect(mockBpService.removeLearner).toHaveBeenCalled()
        expect(mockSnackBar.open).toHaveBeenCalledWith('Learner is removed successfully!', 'X', { duration: 5000 })
        expect(component.filter).toHaveBeenCalledWith('approved')
        expect(component.getLearnersList).toHaveBeenCalled()
    })

    it('should handle error when removing a learner', () => {
        mockBpService.removeLearner.mockReturnValue(throwError({ error: 'Test error' }))

        const eventData = {
            action: 'Remove',
            userData: {
                user_id: 'user-123',
                first_name: 'Test User',
                department: 'Test Dept'
            },
            comment: 'Removed'
        }

        component.removeUser(eventData)

        expect(mockBpService.removeLearner).toHaveBeenCalled()
        expect(mockSnackBar.open).toHaveBeenCalledWith('Something went wrong. Please try after sometime.', 'X', { duration: 5000 })
    })

    it('should open nominate users dialog', async () => {
        // spyOn(component, 'getUsersCount').mockResolvedValue({
        //     enrolled: 0,
        //     totalApplied: 10,
        //     rejected: 0
        // })
        component.batchData = {
            batchId: 'test-batch-123',
            batchAttributes: {
                currentBatchSize: 100
            }
        }
        component.programData = {
            wfApprovalType: 'ONE_STEP_MDO'
        }

        await component.onNominateUsersClick('nominate')

        expect(mockDialogue.open).toHaveBeenCalled()
        expect(mockDialogue.open.mock.calls[0][0].name).toBe('NominateUsersDialogComponent')
    })

    it('should show batch enrollment full dialog when batch is full', async () => {
        // spyOn(component, 'getUsersCount').mockResolvedValue({
        //     enrolled: 0,
        //     totalApplied: 120,
        //     rejected: 0
        // })
        component.batchData = {
            batchId: 'test-batch-123',
            batchAttributes: {
                currentBatchSize: 100
            }
        }

        await component.onNominateUsersClick('nominate')

        expect(mockDialogue.open).toHaveBeenCalled()
        // onNominateUsersClick opens the nominate dialog; the confirm dialog is what the
        // batch-full path used to show.
        expect(mockDialogue.open.mock.calls[0][0].name).toBe('NominateUsersDialogComponent')
    })

    it('should filter new users based on search text', () => {
        component.newUsers = [
            {
                userInfo: { first_name: 'John Doe' },
                wfInfo: [{ deptName: 'HR Department' }]
            },
            {
                userInfo: { first_name: 'Jane Smith' },
                wfInfo: [{ deptName: 'IT Department' }]
            }
        ]
        component.clonedNewUsers = [...component.newUsers]

        component.filterNewUsers('john')

        expect(component.newUsers.length).toBe(1)
        expect(component.newUsers[0].userInfo.first_name).toBe('John Doe')

        // Test reset
        component.filterNewUsers('')
        expect(component.newUsers.length).toBe(2)
    })

    it('should filter approved users based on search text', () => {
        component.approvedUsers = [
            { first_name: 'John Doe', department: 'HR Department' },
            { first_name: 'Jane Smith', department: 'IT Department' }
        ]
        component.clonedApprovedUsers = [...component.approvedUsers]

        component.filterApprovedUsers('it')

        expect(component.approvedUsers.length).toBe(1)
        expect(component.approvedUsers[0].department).toBe('IT Department')

        // Test reset
        component.filterApprovedUsers('')
        expect(component.approvedUsers.length).toBe(2)
    })

    it('should get BP report status', async () => {
        component.batchData = {
            batchId: 'test-batch-123',
            name: 'Test Batch'
        }
        component.programData = {
            identifier: 'test-program-123'
        }
        component.userDetails = {
            rootOrgId: 'test-org-123',
            roles: ['MDO_ADMIN']
        }
        // Every report method branches on this, and it starts empty.
        component.selectedReportType = 'enrollment'

        await component.getBpReportStatus()

        expect(mockBpService.getBpReportStatusApi).toHaveBeenCalled()
        expect(component.reportStatusList.length).toBe(1)
        expect(component.reportStatusList[0].name).toBe('Enrollment Request Report')
        expect(component.tabledata.actions.length).toBe(1)
        expect(component.tabledata.actions[0].name).toBe('downloadReport')
    })

    it('should generate report', async () => {
        // On success, generateReport refreshes through listReports, not getBpReportStatus.
        jest.spyOn(component, 'listReports').mockImplementation()
        component.selectedReportType = 'enrollment'
        component.batchData = {
            batchId: 'test-batch-123'
        }
        component.programData = {
            identifier: 'test-program-123',
            wfSurveyLink: 'https://test.com/survey/123'
        }
        component.userDetails = {
            rootOrgId: 'test-org-123',
            roles: ['MDO_ADMIN']
        }

        await component.generateReport()

        expect(mockBpService.generateBpReport).toHaveBeenCalled()
        expect(component.listReports).toHaveBeenCalled()
    })

    it('should download report', async () => {
        component.batchData = {
            name: 'Test Batch'
        }
        // downloadReports now takes the row to download rather than reading it off
        // reportStatusList.
        const reportItem = {
            lastReportGeneratedOn: '2025-01-01T00:00:00Z',
            downloadLink: 'https://test.com/gcpbpreports/report.xlsx'
        }
        component.reportStatusList = [reportItem]

        await component.downloadReports(reportItem)

        expect(mockBpService.downloadReport).toHaveBeenCalled()
        expect(mockBpService.downloadReport.mock.calls[0][0]).toBe('report.xlsx')
        expect(mockBpService.downloadReport.mock.calls[0][1]).toContain('MDO_TestBatch_Enrollment_Requests_Report')
    })

    it('should format date correctly', () => {
        const formattedDate = component.formatDate('2025-01-15T12:30:45Z')
        expect(formattedDate).toBe('15-01-2025')
    })
})