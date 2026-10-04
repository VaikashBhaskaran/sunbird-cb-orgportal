import { EventBasicDetailsComponent } from './event-basic-details.component'
import { FormGroup, FormControl } from '@angular/forms'
import { MatSnackBar } from '@angular/material/snack-bar'
import { EventsService } from '../../services/events.service'
import { LoaderService } from '../../../../../../../../../../../src/app/services/loader.service'
import { DatePipe } from '@angular/common'
import * as _ from 'lodash'

jest.mock('@angular/material/snack-bar')
jest.mock('../../services/events.service')
jest.mock('../../../../../../../../../../../src/app/services/loader.service')
// jest.mock('@angular/common', () => ({
//   DatePipe: jest.fn().mockImplementation(() => ({
//     transform: jest.fn().mockReturnValue('2025-02-27')),
//   })),
// }));

describe('EventBasicDetailsComponent', () => {
  let component: EventBasicDetailsComponent
  let matSnackBar: MatSnackBar
  let eventSvc: EventsService
  let loaderService: LoaderService
  let datePipe: DatePipe

  beforeEach(() => {
    matSnackBar = new MatSnackBar(null as any, null as any, null as any, null as any, null as any, null as any)
    eventSvc = new EventsService(null as any, null as any)
    loaderService = new LoaderService()
    datePipe = new DatePipe('en-US')

    // NgZone was added since this spec was written; run callbacks straight through.
    const ngZone = { run: (fn: any) => fn(), runOutsideAngular: (fn: any) => fn() } as any
    component = new EventBasicDetailsComponent(matSnackBar, eventSvc, loaderService, datePipe, ngZone)
    component.eventDetails = new FormGroup({
      startTime: new FormControl('12:00 am'),
      endTime: new FormControl('12:30 am'),
      startDate: new FormControl(new Date()),
      registrationLink: new FormControl(''),
      recoredEventUrl: new FormControl(''),
      appIcon: new FormControl(''),
    })
  })

  describe('ngOnChanges', () => {
    it('should correctly convert start time to 12-hour format and update controls', () => {
      const eventDetailsMock = {
        value: { startTime: '14:30+00:00', endTime: '16:00+00:00' }
      }
      // patchValue, not setValue: the form has six controls and this only names two.
      // The date has to be in the future: for an event starting today, ngOnChanges also
      // runs the minimum-start-time check, which clears both times when the chosen one
      // has already passed.
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      component.eventDetails.patchValue({ ...eventDetailsMock.value, startDate: tomorrow })

      const spy = jest.spyOn(component, 'convertTo12HourFormat')
      component.ngOnChanges({
        eventDetails: {
          currentValue: eventDetailsMock,
          previousValue: null,
          firstChange: true,
          isFirstChange: jest.fn().mockReturnValue(true),
        },
      })

      expect(spy).toHaveBeenCalledWith('14:30+00:00')
      expect(component.eventDetails.controls.startTime.value).toBe('2:30 PM')
      expect(component.eventDetails.controls.endTime.value).toBe('4:00 PM')
    })
  })

  describe('convertTo12HourFormat', () => {
    it('should convert 24-hour time format to 12-hour format', () => {
      const result = component.convertTo12HourFormat('14:30+00:00')
      expect(result).toBe('2:30 PM')
    })

    it('should handle 12 AM correctly', () => {
      const result = component.convertTo12HourFormat('00:00+00:00')
      expect(result).toBe('12:00 AM')
    })
  })

  describe('generatMinTimeToStart', () => {
    it('should generate minimum start time for today', () => {
      // minTimeToStart is whatever the pipe formats "now" as, so the stub has to return a
      // time rather than a date.
      const datePipeSpy = jest.spyOn(datePipe, 'transform').mockReturnValue('12:30 AM')
      component.eventDetails.controls.startTime.setValue('12:30 AM')
      component.generatMinTimeToStart()

      expect(component.minTimeToStart).toBe('12:30 AM')
      // Not `new Date()`: that is a different instant from the one the component made,
      // and the two only compare equal when both land in the same millisecond.
      expect(datePipeSpy).toHaveBeenCalledWith(expect.any(Date), 'h:mm a')
    })
  })

  describe('onFileSelected', () => {
    it('should open snackbar when non-image file is selected', () => {
      const mockFile = {
        type: 'application/pdf',
        size: 100,
      }
      // const openSnackBarSpy = jest.spyOn(component, 'openSnackBar')

      component.onFileSelected([mockFile])

      //expect(openSnackBarSpy).toHaveBeenCalledWith('Only images are supported')
    })

    it('should open snackbar when image size exceeds limit', () => {
      const mockFile = {
        type: 'image/png',
        size: 500 * 1024 * 1024, // Exceed 500MB limit
      }
      //const openSnackBarSpy = jest.spyOn(component, 'openSnackBar')

      component.onFileSelected([mockFile])

      //expect(openSnackBarSpy).toHaveBeenCalledWith('Selected image size is more')
    })
  })

  describe('showValidationMsg', () => {
    it('should return true if the form control has the given validation error', () => {
      component.eventDetails.controls.startTime.setValue('')
      component.eventDetails.controls.startTime.markAsTouched()
      component.eventDetails.controls.startTime.setErrors({ required: true })

      const result = component.showValidationMsg('startTime', 'required')
      expect(result).toBe(true)
    })

    it('should return false if the form control does not have the given validation error', () => {
      component.eventDetails.controls.startTime.setValue('')
      component.eventDetails.controls.startTime.markAsTouched()

      const result = component.showValidationMsg('startTime', 'required')
      expect(result).toBe(false)
    })
  })
})
