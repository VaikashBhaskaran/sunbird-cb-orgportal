import { BlendedApporvalService } from './blended-approval.service'
import { of } from 'rxjs'
import _ from 'lodash'

describe('BlendedApporvalService', () => {
    let service: BlendedApporvalService
    let httpClientSpy: { get: jest.Mock; post: jest.Mock }

    beforeEach(() => {
        httpClientSpy = {
            get: jest.fn(),
            post: jest.fn()
        }

        service = new BlendedApporvalService(httpClientSpy as any)
    })

    it('should be created', () => {
        expect(service).toBeTruthy()
    })

    describe('getBlendedProgramsDetails', () => {
        it('should call GET with the correct URL', () => {
            const programId = 'test-program-id'
            const mockResponse = { result: { data: 'test data' } }

            httpClientSpy.get.mockReturnValue(of(mockResponse))

            service.getBlendedProgramsDetails(programId).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })

            expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/proxies/v8/action/content/v3/read/test-program-id')
        })
    })

    describe('getLearners', () => {
        it('should call GET with the correct URL including orgName', () => {
            const batchId = 'batch-123'
            const orgName = 'test-org'
            const mockResponse = { learners: [] }

            httpClientSpy.get.mockReturnValue(of(mockResponse))

            service.getLearners(batchId, orgName).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })

            expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/protected/v8/cohorts/course/getUsersForBatch/batch-123/test-org')
        })
    })

    describe('getLearnersWithoutOrg', () => {
        it('should call GET with the correct URL without orgName', () => {
            const batchId = 'batch-123'
            const mockResponse = { learners: [] }

            httpClientSpy.get.mockReturnValue(of(mockResponse))

            service.getLearnersWithoutOrg(batchId).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })

            expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/protected/v8/cohorts/course/getUsersForBatch/batch-123')
        })
    })

    describe('getRequests', () => {
        it('should call POST with the correct URL and request body', () => {
            const reqBody = { key: 'value' }
            const mockResponse = { requests: [] }

            httpClientSpy.post.mockReturnValue(of(mockResponse))

            service.getRequests(reqBody).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })

            expect(httpClientSpy.post).toHaveBeenCalledWith('/apis/proxies/v8/workflow/blendedprogram/search', reqBody)
        })
    })

    describe('getSerchRequests', () => {
        it('should call POST with the correct URL and request body', () => {
            const reqBody = { search: 'term' }
            const mockResponse = { results: [] }

            httpClientSpy.post.mockReturnValue(of(mockResponse))

            service.getSerchRequests(reqBody).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })

            expect(httpClientSpy.post).toHaveBeenCalledWith('/apis/proxies/v8/workflow/blendedprogram/searchV2/mdo', reqBody)
        })
    })

    describe('updateBlendedRequests', () => {
        it('should call POST with the correct URL and request body', () => {
            const reqBody = { id: '123', status: 'approved' }
            const mockResponse = { updated: true }

            httpClientSpy.post.mockReturnValue(of(mockResponse))

            service.updateBlendedRequests(reqBody).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })

            expect(httpClientSpy.post).toHaveBeenCalledWith('/apis/proxies/v8/workflow/blendedprogram/update/mdo', reqBody)
        })
    })

    describe('getUserById', () => {
        it('should call GET with the correct URL when userId is provided', () => {
            const userId = 'user-123'
            const mockResponse = { result: { response: { name: 'Test User' } } }

            httpClientSpy.get.mockReturnValue(of(mockResponse))

            service.getUserById(userId).subscribe(response => {
                expect(response).toEqual(mockResponse.result.response)
            })

            expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/proxies/v8/api/user/v2/read/user-123')
        })

        it('should call GET without userId when not provided', () => {
            const mockResponse = { result: { response: { name: 'Current User' } } }

            httpClientSpy.get.mockReturnValue(of(mockResponse))

            service.getUserById('').subscribe(response => {
                expect(response).toEqual(mockResponse.result.response)
            })

            expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/proxies/v8/api/user/v2/read/')
        })
    })

    describe('downloadCert', () => {
        it('should call GET with the correct URL', () => {
            const certId = 'cert-123'
            const mockResponse = { url: 'certificate-url' }

            httpClientSpy.get.mockReturnValue(of(mockResponse))

            service.downloadCert(certId).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })

            expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/protected/v8/cohorts/course/batch/cert/download//cert-123')
        })
    })

    describe('getSurveyByUserID', () => {
        it('should call POST with the correct URL and request body', () => {
            const reqBody = { userId: 'user-123' }
            const mockResponse = { surveys: [] }

            httpClientSpy.post.mockReturnValue(of(mockResponse))

            service.getSurveyByUserID(reqBody).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })

            expect(httpClientSpy.post).toHaveBeenCalledWith('apis/proxies/v8/forms/searchForms', reqBody)
        })
    })

    describe('nominateLearners', () => {
        it('should call POST with the correct URL and request body', () => {
            const reqBody = { programId: 'prog-123', learners: ['user1', 'user2'] }
            const mockResponse = { success: true }

            httpClientSpy.post.mockReturnValue(of(mockResponse))

            service.nominateLearners(reqBody).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })

            expect(httpClientSpy.post).toHaveBeenCalledWith('/apis/proxies/v8/workflow/blendedprogram/admin/enrol', reqBody)
        })
    })

    describe('removeLearner', () => {
        it('should call POST with the correct URL and request body', () => {
            const reqBody = { programId: 'prog-123', userId: 'user-123' }
            const mockResponse = { success: true }

            httpClientSpy.post.mockReturnValue(of(mockResponse))

            service.removeLearner(reqBody).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })

            // The call now carries an HttpHeaders argument as well.
            expect(httpClientSpy.post).toHaveBeenCalledWith(
                '/apis/proxies/v8/workflow/blendedprogram/remove/approved/user',
                reqBody,
                expect.objectContaining({ headers: expect.anything() })
            )
        })
    })

    describe('fetchBlendedUserCount', () => {
        it('should call POST with the correct URL and request body', async () => {
            const reqBody = { programId: 'prog-123' }
            const mockResponse = { count: 10 }

            httpClientSpy.post.mockReturnValue(of(mockResponse))
            const response = await service.fetchBlendedUserCount(reqBody)

            expect(response).toEqual(mockResponse)
            expect(httpClientSpy.post).toHaveBeenCalledWith('apis/proxies/v8/workflow/blendedprogram/enrol/status/count', reqBody)
        })
    })

    describe('getBpReportStatusApi', () => {
        it('should call POST with the correct URL and request body', () => {
            const reqBody = { reportId: 'report-123' }
            const mockResponse = null

            httpClientSpy.post.mockReturnValue(of(mockResponse))

            service.getBpReportStatusApi(reqBody).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })

            expect(httpClientSpy.post).toHaveBeenCalledWith('apis/proxies/v8/bp/v1/bpreport/status', reqBody)
        })
    })

    describe('generateBpReport', () => {
        it('should call POST with the correct URL and request body', () => {
            const reqBody = { programId: 'prog-123' }
            const mockResponse = null

            httpClientSpy.post.mockReturnValue(of(mockResponse))

            service.generateBpReport(reqBody).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })

            expect(httpClientSpy.post).toHaveBeenCalledWith('apis/proxies/v8/bp/v1/generate/report', reqBody)
        })
    })

    describe('downloadReport', () => {
        it('should call GET with the correct URL and create a download link', () => {
            // Create mock DOM elements and functions
            const mockBlob = new Blob(['test data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            const mockUrl = 'blob:test-url'
            const mockLink = {
                href: '',
                download: '',
                click: jest.fn()
            }

            // Mock document.createElement and URL methods
            document.createElement = jest.fn().mockReturnValue(mockLink)
            window.URL.createObjectURL = jest.fn().mockReturnValue(mockUrl)
            window.URL.revokeObjectURL = jest.fn()

            // Setup spy response
            httpClientSpy.get.mockReturnValue(of(mockBlob))

            // Call the method
            service.downloadReport('report-file-url', 'report.xlsx')

            // Verify HTTP call
            expect(httpClientSpy.get).toHaveBeenCalledWith('apis/proxies/v8/bp/v1/bpreport/download/report-file-url', { responseType: 'blob' })

            // Verify DOM manipulation
            expect(document.createElement).toHaveBeenCalledWith('a')
            expect(window.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob))
            expect(mockLink.href).toBe(mockUrl)
            expect(mockLink.download).toBe('report.xlsx')
            expect(mockLink.click).toHaveBeenCalled()
            expect(window.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl)
        })
    })

    describe('getSurveyByFormId', () => {
        it('should call GET with the correct URL', () => {
            const formId = 'form-123'
            const mockResponse = { form: { questions: [] } }

            httpClientSpy.get.mockReturnValue(of(mockResponse))

            service.getSurveyByFormId(formId).subscribe(response => {
                expect(response).toEqual(mockResponse)
            })

            expect(httpClientSpy.get).toHaveBeenCalledWith('/apis/proxies/v8/forms/v2/getFormById?formId=form-123')
        })
    })
})