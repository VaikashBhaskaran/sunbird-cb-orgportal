import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing'

import { HandsOnComponent } from './hands-on.component'

describe('HandsOnComponent', () => {
  let component: HandsOnComponent
  let fixture: ComponentFixture<HandsOnComponent>

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [HandsOnComponent],
    })
    .compileComponents()
  }))

  beforeEach(() => {
    fixture = TestBed.createComponent(HandsOnComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
})
