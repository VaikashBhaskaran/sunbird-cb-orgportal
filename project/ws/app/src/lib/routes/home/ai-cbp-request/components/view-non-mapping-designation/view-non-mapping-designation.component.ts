import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import { MatTableDataSource } from '@angular/material/table'
/* tslint:disable */
import * as _ from 'lodash'
import { AICBPRequestService } from '../../../services/ai-cbp-request.service'
import { MatDialog } from '@angular/material/dialog'
import { ConfigurationsService } from '@sunbird-cb/utils-v2'
/* tslint:enable */
export enum statusValue {
  Assigned = 'Assigned',
  Unassigned = 'Unassigned',
  Inprogress = 'InProgress',
  invalid = 'Invalid',
  fullfill = 'Fulfill',
}
@Component({
  selector: 'ws-view-non-mapping-designation',
  templateUrl: './view-non-mapping-designation.component.html',
  styleUrls: ['./view-non-mapping-designation.component.scss'],
  standalone: false
})

export class ViewNonMappingDesignationComponent implements OnInit {
  pageNo = 1
  pageSize = 20
  @ViewChild('dialogContent') dialogContent!: ElementRef
  defaultPageSizeOptions = [10, 20, 25, 50, 100]
  constructor(public aicbpRequestSvc: AICBPRequestService, public dialog: MatDialog, public configSvc: ConfigurationsService) {

  }

  displayedColumns: string[] = [
    'designation_name',
    'organisation',
    'created_at',
    'status'
  ]

  staticRequestList: any[] = [
  ]
  dataSource!: MatTableDataSource<any>
  requestCount: number = 0
  rootOrgId: any


  ngOnInit() {
    this.loadStaticTableData()
  }

  loadStaticTableData() {

    this.staticRequestList = []


    this.rootOrgId = this.configSvc?.unMappedUser?.rootOrg?.rootOrgId


    this.aicbpRequestSvc.getNonMappingDesignationList(this.pageNo,
      this.pageSize,
      this.rootOrgId)
      .subscribe((approvalRequest: any) => {

        console.log('approvalRequest', approvalRequest)

        approvalRequest?.items?.forEach((request: any) => {

          this.staticRequestList.push({
            designation_name: request.designation_name,
            organisation: request.organisation || 'N/A',
            division: request.division || 'N/A',
            status: request.status || 'N/A',
            email: request.email || 'N/A',
            id: request.id,
            created_at: new Date(request.created_at),
          })

        })

        this.dataSource = new MatTableDataSource(this.staticRequestList)

        this.requestCount = approvalRequest?.pagination?.total_items || 0

        console.log('requestCount =>', this.requestCount)

        this.scrollToTop()
      })



  }

  scrollToTop(): void {
    this.dialogContent.nativeElement.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  viewNonMatchingDesignation() {

  }

  close() {
    this.dialog.closeAll()
  }

  onChangePage(event: any) {
    this.pageNo = event.pageIndex + 1
    this.pageSize = event.pageSize

    this.loadStaticTableData()
  }

}
