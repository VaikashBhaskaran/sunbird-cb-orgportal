import { NestedTreeControl } from '@angular/cdk/tree'
import { Component, EventEmitter, OnDestroy, OnInit, Output, Input, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core'
import { DomSanitizer, SafeUrl } from '@angular/platform-browser'
import { ActivatedRoute, NavigationExtras, Params } from '@angular/router'


import { WidgetContentService } from '@sunbird-cb/toc'
import { NsWidgetResolver } from '@sunbird-cb/resolver'
import {
  // LoggerService,
  ConfigurationsService,
  UtilityService,
} from '@sunbird-cb/utils'
// tslint:disable-next-line
import _ from 'lodash'
import { of, Subscription } from 'rxjs'
import { delay } from 'rxjs/operators'
import { ViewerDataService } from '../../viewer-data.service'
import { ViewerUtilService } from '../../viewer-util.service'
import { MatTreeNestedDataSource } from '@angular/material/tree'
import { NsContent } from '../../models/constant'
import { VIEWER_ROUTE_FROM_MIME, viewerRouteGenerator } from '../../services/viewer-route-utils'
// import { AppTocService } from '@ws/app/src/lib/routes/app-toc/services/app-toc.service'
export interface IViewerTocCard {
  identifier: string
  viewerUrl: string
  thumbnailUrl: string
  title: string
  duration: number
  type: string
  mimeType: NsContent.EMimeTypes
  complexity: string
  children: null | IViewerTocCard[]
  primaryCategory: NsContent.EPrimaryCategory
  collectionId: string | null
  collectionType: string,
  batchId: string | number,
  viewMode: string,
  optionalReading: boolean,
  channelId: string
}

export type TCollectionCardType = 'content' | 'playlist' | 'goals'

interface ICollectionCard {
  type: TCollectionCardType | null
  id: string
  title: string
  thumbnail: string
  subText1: string
  subText2: string
  duration: number
  redirectUrl: string | null
  queryParams: Params
}

@Component({
  selector: 'viewer-viewer-toc',
  templateUrl: './viewer-toc.component.html',
  styleUrls: ['./viewer-toc.component.scss'],
  standalone: false,
})
export class ViewerTocComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Output() hidenav = new EventEmitter<boolean>()
  @Input() forPreview = false
  @Input() contentData: any = {}
  @Input() batchData: any
  @Input() tocStructure: any
  @Input() hierarchyMapData: any = {}
  @Input() config: any
  @Input() isPreAssessment = false
  @Output() pathSetEvent = new EventEmitter()

  constructor(
    private activatedRoute: ActivatedRoute,
    private domSanitizer: DomSanitizer,
    // private logger: LoggerService,
    private contentSvc: WidgetContentService,
    private utilitySvc: UtilityService,
    private viewerDataSvc: ViewerDataService,
    private viewSvc: ViewerUtilService,
    private configSvc: ConfigurationsService,
    // private contentProgressSvc: ContentProgressService,
    // private tocSvc: AppTocService,
  ) {
    this.nestedTreeControl = new NestedTreeControl<IViewerTocCard>(this._getChildren)
    this.nestedDataSource = new MatTreeNestedDataSource()
  }
  resourceId: string | null = null
  collection: any | null = null
  collectionType = 'course'
  collectionId: string | null = ''
  channelId: any
  batchId: any
  viewMode = 'START'
  queue: IViewerTocCard[] = []
  tocMode: 'FLAT' | 'TREE' = 'TREE'
  nestedTreeControl: NestedTreeControl<IViewerTocCard>
  nestedDataSource: MatTreeNestedDataSource<IViewerTocCard>
  defaultThumbnail: SafeUrl | null = null
  isFetching = true
  pathSet: any
  contentProgressHash: { [id: string]: number } | null = null
  errorWidgetData: NsWidgetResolver.IRenderConfigWithTypedData<any> = {
    widgetType: 'errorResolver',
    widgetSubType: 'errorResolver',
    widgetData: {
      errorType: '',
    },
  }
  enumContentTypes = NsContent.EDisplayContentTypes
  collectionCard: ICollectionCard | null = null
  isErrorOccurred = false
  private paramSubscription: Subscription | null = null
  private viewerDataServiceSubscription: Subscription | null = null
  hierarchyData: any
  enrollmentList: any
  preAssessmentPathSet: any
  // tslint:disable-next-line
  hasNestedChild = (_: number, nodeData: IViewerTocCard) =>
    nodeData && nodeData.children && nodeData.children.length
  private _getChildren = (node: IViewerTocCard) => {
    return node && node.children ? node.children : []
  }

  ngOnInit() {
    this.hierarchyData = this.activatedRoute.snapshot.data.hierarchyData
      && this.activatedRoute.snapshot.data.hierarchyData.data || ''
    this.enrollmentList = this.activatedRoute.snapshot.data.enrollmentData
      && this.activatedRoute.snapshot.data.enrollmentData.data || ''
    const contentRead = this.activatedRoute.snapshot.data.contentRead
      && this.activatedRoute.snapshot.data.contentRead.data || ''
    if (contentRead.result && contentRead.result.content) {
      this.contentSvc.currentContentReadMetaData = contentRead.result.content
    }
    if (this.configSvc.instanceConfig && this.configSvc.instanceConfig.logos) {
      const logo = this.configSvc.instanceConfig.logos.defaultContent || ''
      this.defaultThumbnail = this.domSanitizer.bypassSecurityTrustResourceUrl(logo)
    }

    const forPreview = window.location.href.includes('/public/') || window.location.href.includes('&preview=true') ||
      window.location.href.includes('&status=Draft')
    if (!forPreview) {
      // this.getEnrollmentList()
    }

    this.initializeComponent()
  }

  ngAfterViewInit() {
    // Ensure inputs are properly set after view initialization
    if (this.isPreAssessment && this.contentData) {
      this.handlePreAssessmentLogic()
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Handle input changes, especially for isPreAssessment and contentData
    if (changes['isPreAssessment'] || changes['contentData']) {
      // Delay the execution to ensure all inputs are properly set
      setTimeout(() => {
        this.handlePreAssessmentLogic()
      }, 0)
    }
  }

  private handlePreAssessmentLogic() {
    if (this.isPreAssessment && this.contentData) {
      // Handle pre-assessment specific logic here
      this.processPreAssessmentData()
    }
  }

  private processPreAssessmentData() {

    if (this.contentData && this.contentData.preEnrolmentResources) {
      this.queue = this.getLeafNodes(this.contentData.preEnrolmentResources, [])
      this.queue.forEach((item: any) => {
        // Use available data sources in order of preference
        item['collectionId'] = this.collection?.identifier || this.contentData?.identifier || this.collectionId
        item['batchId'] = this.collection?.batchId || this.contentData?.batchId || this.batchId
        if (item?.courseCategory === 'Pre Enrolment Assessment') {
          item['mimeType'] = 'application/vnd.sunbird.questionset'
        }
      })

      // Trigger tree processing and path expansion
      this.processCollectionForTree()

      if (this.resourceId && this.queue.length) {
        this.processCurrentResourceChange()
      }
    }
  }

  private waitForInputsAndProcess() {

    // Check multiple times with increasing delays to account for Angular's change detection
    const checkAndProcess = (attempt: number = 1) => {

      if (this.isPreAssessment && this.contentData && this.contentData.preEnrolmentResources) {
        this.queue = []
        this.queue = this.getLeafNodes(this.contentData.preEnrolmentResources, [])
        this.queue.forEach((item: any) => {
          item['collectionId'] = this.collection?.identifier || this.contentData?.identifier || this.collectionId
          item['batchId'] = this.collection?.batchId || this.contentData?.batchId || this.batchId
          if (item?.courseCategory === 'Pre Enrolment Assessment') {
            item['mimeType'] = 'application/vnd.sunbird.questionset'
          }
        })

        this.processCollectionForTree()

        if (this.resourceId && this.queue.length) {
          this.processCurrentResourceChange()
        }
      } else if (attempt < 5) {
        // Try again after a delay, up to 5 attempts
        setTimeout(() => checkAndProcess(attempt + 1), attempt * 100)
      } else {
        // Fall back to standard processing after all attempts
        if (this.collection) {
          this.queue = this.utilitySvc.getLeafNodes(this.collection, [])
          if (this.resourceId) {
            this.processCurrentResourceChange()
          }
        }
      }
    }

    // Start the checking process
    checkAndProcess()
  }

  private initializeComponent() {
    this.paramSubscription = this.activatedRoute.queryParamMap.subscribe(async params => {
      this.collectionId = params.get('collectionId')
      this.collectionType = params.get('collectionType') || 'course'
      const primaryCategory = params.get('primaryCategory')
      this.viewMode = params.get('viewMode') || 'START'
      this.forPreview = params.get('preview') === 'true' ? true : false
      this.channelId = params.get('channelId')
      try {
        this.batchId = params.get('batchId')
      } catch {
        this.batchId = 0
      }

      // await this.contentSvc.fetchContent(this.collectionId).subscribe(res => {
      //   this.hierarchyData = res
      //   console.log('res', res)
      // })

      if (this.collectionId && this.collectionType && primaryCategory) {
        if (

          this.collectionType.toLowerCase() ===
          NsContent.EMiscPlayerSupportedCollectionTypes.PLAYLIST.toLowerCase()
        ) {
          this.collection = await this.getPlaylistContent(this.collectionId, primaryCategory)
        } else if (

          this.collectionType.toLowerCase() === NsContent.EPrimaryCategory.MODULE.toLowerCase() ||
          this.collectionType.toLowerCase() === NsContent.EPrimaryCategory.COURSE.toLowerCase() ||
          this.collectionType.toLowerCase() === NsContent.EPrimaryCategory.PROGRAM.toLowerCase() ||
          this.collectionType.toLowerCase() === NsContent.EPrimaryCategory.CURATED_PROGRAM.toLowerCase() ||
          this.collectionType.toLowerCase() === NsContent.EPrimaryCategory.STANDALONE_ASSESSMENT.toLowerCase() ||
          this.collectionType.toLowerCase() === NsContent.EPrimaryCategory.BLENDED_PROGRAM.toLowerCase()
        ) {
          // this.collection = await this.getCollection(this.collectionId, this.collectionType)
          // console.log('this.collection', this.collection)
          // console.log('this.collectionId', this.collectionId)
          // await this.contentSvc.fetchAuthoringContentHierarchy(this.collectionId).subscribe(res => {

          //   this.contentSvc.currentContentReadMetaData = res.result.content
          //   this.collection = res.result.content
          //   console.log('res', res)
          // })
          await this.contentSvc.fetchContent(this.collectionId, 'detail', [], '').subscribe(async res => {
            // console.log('res', res.result.content)
            this.collection = res.result.content
            if (this.forPreview && !this.isPreAssessment) {
              await this.fetchCourseHeirarchy(this.collection)
              await this.checkModuleWiseData(this.collection)
              const collection: any = this.getCollectionWithHierarchy(this.collection)
              // console.log('collection', collection)
              collection.then((data: any) => {
                // console.log('data', data)
                this.collection = data
                if (data) {
                  if (collection) {

                    if (this.forPreview) {
                      const localQueue = this.utilitySvc.getLeafNodes(data, [])
                      // console.log('localQueue', localQueue)
                      // this.queue = _.compact(_.map(localQueue, q => {
                      //   if (NsContent.PUBLIC_SUPPORTED_CONTENT_TYPES.includes(q.mimeType)) {
                      //     return q
                      //   } return null
                      // }))
                      this.queue = localQueue

                    } else {
                      this.queue = this.utilitySvc.getLeafNodes(data, [])
                    }
                    // console.log('this.queue', this.queue)
                    this.processCurrentResourceChange()
                    // console.log('nestedDataSource', this.nestedDataSource)
                  }
                }
              })

            } else {
              // Use a more reliable approach to wait for inputs
              this.waitForInputsAndProcess()

            }

          })

          // this.collection = _.get(this.hierarchyData, 'result.content')
        } else {
          this.isErrorOccurred = true
        }
        // if (this.collection) {

        //   if (this.forPreview) {
        //     const localQueue = this.utilitySvc.getLeafNodes(this.collection, [])
        //     // console.log('localQueue', localQueue)
        //     // this.queue = _.compact(_.map(localQueue, q => {
        //     //   if (NsContent.PUBLIC_SUPPORTED_CONTENT_TYPES.includes(q.mimeType)) {
        //     //     return q
        //     //   } return null
        //     // }))
        //     this.queue = localQueue

        //   } else {
        //     this.queue = this.utilitySvc.getLeafNodes(this.collection, [])
        //   }
        // }
        // if (this.resourceId === null && this.viewerDataSvc.resourceId === null) {
        //   if (this.queue && this.queue.length) {
        //     this.resourceId = this.queue[0]['identifier']
        //   }
        //   console.log('this.resourceId', this.resourceId)
        //   this.processCurrentResourceChange()
        //   // if (this.resourceId !== this.viewerDataSvc.resourceId) {
        //   //   this.resourceId = this.viewerDataSvc.resourceId
        //   //   this.processCurrentResourceChange()
        //   // }

        // }
      }
      if (this.resourceId) {
        this.processCurrentResourceChange()
      }
    })
    this.viewerDataServiceSubscription = this.viewerDataSvc.changedSubject.subscribe(_data => {
      if (this.resourceId !== this.viewerDataSvc.resourceId) {
        if (this.viewerDataSvc && this.viewerDataSvc.resource && this.viewerDataSvc.resource.contextCategory &&
          this.viewerDataSvc.resource.contextCategory === 'Pre Enrolment Assessment' &&
          this.viewerDataSvc.resource.parent
        ) {
          this.resourceId = this.viewerDataSvc.resource.parent
        } else {
          this.resourceId = this.viewerDataSvc.resourceId
        }
        // this.processCurrentResourceChange()
        if (this.isPreAssessment && this.contentData) {
          this.queue = this.getLeafNodes(this.contentData['preEnrolmentResources'], [])
          this.queue.forEach((item: any) => {
            // Use collection data if available, otherwise use contentData or route params
            item['collectionId'] = this.collection?.identifier || this.contentData?.identifier || this.collectionId
            item['batchId'] = this.collection?.batchId || this.contentData?.batchId || this.batchId
            if (item?.courseCategory === 'Pre Enrolment Assessment') {
              item['mimeType'] = 'application/vnd.sunbird.questionset'
            }
          })
          if (this.resourceId && this.queue.length) {
            this.processCurrentResourceChange()
          }
        } else {
          this.processCurrentResourceChange()
        }
      }
    })
  }
  // tslint:disable
  // private getContentProgressHash() {
  //   if (this.collection && this.batchId && this.configSvc.userProfile) {
  //     if (this.resourceId) {
  //       const requestCourse = this.viewSvc.getBatchIdAndCourseId(this.collection.identifier, this.batchId, this.resourceId)
  //       this.contentProgressSvc
  //       .getProgressHash(requestCourse.courseId, requestCourse.batchId , this.configSvc.userProfile.userId)
  //       .subscribe((progressHash:  any) => {
  //         this.contentProgressHash = progressHash
  //         if(this.collection && this.collection.identifier) {
  //           // this.updateProgressBasedOnHash(progressHash)
  //         }
  //       })
  //     }
  //   }
  // }

  // private updateProgressBasedOnHash(progressHash: any) {
  //     if(
  //       this.contentData.primaryCategory === NsContent.EPrimaryCategory.BLENDED_PROGRAM ||
  //       this.contentData.primaryCategory === NsContent.EPrimaryCategory.CURATED_PROGRAM ||
  //       this.contentData.primaryCategory === NsContent.EPrimaryCategory.PROGRAM
  //     ) {
  //       this.contentSvc.programChildCourseResumeData$.subscribe((data) => {
  //         console.log('updateProgressBasedOnHash data', data)
  //         if(data) {
  //           this.contentData.children && this.contentData.children.forEach((item: any)=>{
  //             if(
  //               item.primaryCategory === NsContent.EPrimaryCategory.COURSE &&
  //               item.identifier === data.courseId
  //             ){
  //               this.tocSvc.mapCompletionPercentage(item, data.resumeData)
  //               this.tocSvc.mapModuleDurationAndProgress(item, item)
  //             }
  //           })
  //         }
  //       })
  //       // this.tocSvc.mapCompletionPercentageProgram(this.contentData, this.enrollmentList.courses)
  //     } else {
  //       this.tocSvc.mapCompletionPercentage(this.contentData, progressHash.result.contentList)
  //       this.tocSvc.mapModuleDurationAndProgress(this.contentData, this.contentData)
  //     }
  // }


  checkModuleWiseData(content: any) {
    if (content && content.children && content.children.length) {
      content.children.forEach((ele: any) => {
        if (ele.primaryCategory === NsContent.EPrimaryCategory.MODULE) {
          let moduleResourseCount = 0
          let offlineResourseCount = 0
          if (ele.children) {
            ele.children.forEach((childEle: any) => {
              if (childEle.primaryCategory !== NsContent.EPrimaryCategory.OFFLINE_SESSION) {
                moduleResourseCount = moduleResourseCount + 1
              } else {
                offlineResourseCount = offlineResourseCount + 1
              }
            })
            ele['moduleResourseCount'] = moduleResourseCount
            ele['offlineResourseCount'] = offlineResourseCount
          }
        } else {
          if (ele.primaryCategory === NsContent.EPrimaryCategory.COURSE) {
            this.checkModuleWiseData(ele)
          }
        }
      })
    }
  }
  async fetchCourseHeirarchy(contentData: any) {
    if (contentData && contentData.children) {
      for (const ele of contentData.children) {
        if (ele.primaryCategory === NsContent.ECourseCategory.COURSE) {
          await this.contentSvc.fetchContent(ele.identifier).toPromise().then(async (subEle: any) => {
            if (subEle.result && subEle.result.content
              && subEle.result.content.children && subEle.result.content.children.length) {
              ele['children'] = subEle.result.content.children
            }
          })
        }
      }
    }
  }

  // tslint:enable
  ngOnDestroy() {
    if (this.paramSubscription) {
      this.paramSubscription.unsubscribe()
    }
    if (this.viewerDataServiceSubscription) {
      this.viewerDataServiceSubscription.unsubscribe()
    }
  }
  changeTocMode() {
    if (this.tocMode === 'FLAT') {
      this.tocMode = 'TREE'
      // this.processCollectionForTree()
    } else {
      this.tocMode = 'FLAT'
    }
  }
  getParams(content: IViewerTocCard): NavigationExtras {
    return {
      queryParams: {
        primaryCategory: content.primaryCategory,
        collectionId: content.collectionId,
        collectionType: content.collectionType,
        batchId: content.batchId,
        viewMode: content.viewMode,
        preview: this.forPreview,
      },
      fragment: '',
    }
  }
  private processCurrentResourceChange() {
    // Handle case when collection is undefined but we have queue data
    if ((this.collection || this.queue.length > 0) && this.resourceId) {
      const currentIndex = this.queue.findIndex(c => c.identifier === this.resourceId)
      const next =
        currentIndex + 1 < this.queue.length ? this.queue[currentIndex + 1] : null
      const prev = currentIndex - 1 >= 0 ? this.queue[currentIndex - 1] : null
      if (this.queue && this.queue.length) {
        this.viewerDataSvc.updateNextPrevResource(Boolean(this.collection || this.queue.length), prev, next)
        this.processCollectionForTree()
        this.expandThePath()
      }

      // if (next && next.viewerUrl === '0') { // temp
      // this.getContentProgressHash()
      // }
    }
  }
  // private async getCollection(
  //   collectionId: string,
  //   _collectionType: string,
  // ): Promise<IViewerTocCard | null> {
  //   try {
  //     let content: any
  //     if (collectionId) {
  //       if (this.hierarchyData) {
  //         content = this.hierarchyData
  //       } else {
  //         content = await (this.forPreview
  //           ? this.contentSvc.fetchAuthoringContent(collectionId)
  //           : this.contentSvc.fetchContent(collectionId, 'detail', [], _collectionType)
  //         ).toPromise()
  //       }
  //       const contentData = content
  //       this.collection = content
  //       this.contentSvc.currentMetaData = contentData
  //       this.collectionCard = this.createCollectionCard(contentData)
  //       const viewerTocCardContent = this.convertContentToIViewerTocCard(contentData)
  //       this.isFetching = false
  //       return viewerTocCardContent
  //     }
  //     return null
  //   } catch (err: any) {
  //     switch (err && err.status) {
  //       case 403: {
  //         this.errorWidgetData.widgetData.errorType = 'accessForbidden'
  //         break
  //       }
  //       case 404: {
  //         this.errorWidgetData.widgetData.errorType = 'notFound'
  //         break
  //       }
  //       case 500: {
  //         this.errorWidgetData.widgetData.errorType = 'internalServer'
  //         break
  //       }
  //       case 503: {
  //         this.errorWidgetData.widgetData.errorType = 'serviceUnavailable'
  //         break
  //       }
  //       default: {
  //         this.errorWidgetData.widgetData.errorType = 'somethingWrong'
  //         break
  //       }
  //     }
  //     this.isFetching = false
  //     return null
  //   }
  // }

  private async getCollectionWithHierarchy(content: any) {
    try {
      const contentData = content
      this.collection = content
      this.contentSvc.currentMetaData = contentData
      this.collectionCard = this.createCollectionCard(contentData)
      const viewerTocCardContent = this.convertContentToIViewerTocCard(contentData)
      console.log('viewerTocCardContent--', viewerTocCardContent)
      this.isFetching = false
      return viewerTocCardContent
    } catch (err: any) {
      switch (err && err.status) {
        case 403: {
          this.errorWidgetData.widgetData.errorType = 'accessForbidden'
          break
        }
        case 404: {
          this.errorWidgetData.widgetData.errorType = 'notFound'
          break
        }
        case 500: {
          this.errorWidgetData.widgetData.errorType = 'internalServer'
          break
        }
        case 503: {
          this.errorWidgetData.widgetData.errorType = 'serviceUnavailable'
          break
        }
        default: {
          this.errorWidgetData.widgetData.errorType = 'somethingWrong'
          break
        }
      }
      this.isFetching = false
      return null
    }

  }

  private async getPlaylistContent(
    collectionId: string,
    _collectionType: string,
  ): Promise<IViewerTocCard | null> {
    try {
      const playlistFetchResponse: any = await this.contentSvc
        .fetchCollectionHierarchy('playlist', collectionId, 0, 1000)
        .toPromise()

      const content: any = playlistFetchResponse!.data
      this.collectionCard = this.createCollectionCard(content)
      const viewerTocCardContent = this.convertContentToIViewerTocCard(content)
      console.log('viewerTocCardContent--', viewerTocCardContent)
      this.isFetching = false
      return viewerTocCardContent
    } catch (err: any) {
      switch (err && err.status) {
        case 403: {
          this.errorWidgetData.widgetData.errorType = 'accessForbidden'
          break
        }
        case 404: {
          this.errorWidgetData.widgetData.errorType = 'notFound'
          break
        }
        case 500: {
          this.errorWidgetData.widgetData.errorType = 'internalServer'
          break
        }
        case 503: {
          this.errorWidgetData.widgetData.errorType = 'serviceUnavailable'
          break
        }
        default: {
          this.errorWidgetData.widgetData.errorType = 'somethingWrong'
          break
        }
      }
      this.isFetching = false
      return null
    }
  }

  private convertContentToIViewerTocCard(content: NsContent.IContent | any): IViewerTocCard {
    // console.log('content.children', content.identifier, content)
    // return {
    //   identifier: content.identifier,
    //   viewerUrl: `/viewer/${VIEWER_ROUTE_FROM_MIME(content.mimeType)}/${content.identifier}`,
    //   thumbnailUrl: content.appIcon,
    //   title: content.name,
    //   duration: content.duration,
    //   type: content.displayContentType,
    //   complexity: content.difficultyLevel,
    //   children: Array.isArray(content.children) && content.children.length ?
    //     content.children.map(child => this.convertContentToIViewerTocCard(child)) : null,
    // }

    // NOSONAR
    console.log('content--', content)
    return {
      identifier: content.identifier,
      viewerUrl: `${this.forPreview ? '' : ''}/viewer/${VIEWER_ROUTE_FROM_MIME( // NOSONAR
        content.mimeType,
        // )}/${content.identifier}?primaryCategory=${content.primaryCategory}
        // &collectionId=${this.viewerDataSvc.collectionId}&collectionType=${this.collectionType}
        // &batchId=${this.batchId}&viewMode=${this.viewMode}`,
      )}/${content.identifier}`,
      thumbnailUrl: this.forPreview
        ? this.viewSvc.getAuthoringUrl(content.appIcon)
        : content.appIcon,
      title: content.name,
      duration: content.duration,
      collectionId: this.collectionId,
      collectionType: this.collectionType,
      batchId: this.batchId,
      viewMode: this.viewMode,
      type: content.primaryCategory,
      mimeType: content.mimeType,
      complexity: content.difficultyLevel || 'Easy',
      primaryCategory: content.primaryCategory,
      optionalReading: content.optionalReading,
      channelId: this.channelId,
      children:
        Array.isArray(content.children) && content.children.length
          && content.mimeType !== NsContent.EMimeTypes.QUESTION_SET // this is because of ne api ( questionset structure)
          ? content.children.map((child: any) => this.convertContentToIViewerTocCard(child))
          : null,
    }
  }

  private createCollectionCard(
    collection: NsContent.IContent | NsContent.IContentMinimal,
  ): ICollectionCard {
    // return {
    //   type: this.getCollectionTypeCard(collection.displayContentType),
    //   id: collection.identifier,
    //   title: collection.name,
    //   thumbnail: collection.appIcon,
    //   subText1: collection.displayContentType || collection.contentType,
    //   subText2: collection.difficultyLevel,
    //   duration: collection.duration,
    //   redirectUrl: this.getCollectionTypeRedirectUrl(collection.displayContentType, collection.identifier),
    // }
    const img = collection.posterImage ? collection.posterImage : collection.appIcon
    return {
      type: this.getCollectionTypeCard(collection.primaryCategory),
      id: collection.identifier,
      title: collection.name,
      thumbnail: this.forPreview
        ? this.viewSvc.getAuthoringUrl(this.viewSvc.getPublicUrl(img))
        : this.viewSvc.getPublicUrl(img),
      subText1: collection.primaryCategory,
      subText2: collection.difficultyLevel,
      duration: collection.duration,
      redirectUrl: this.getCollectionTypeRedirectUrl(
        collection.identifier,
        // collection.primaryCategory,
        collection.primaryCategory,
      ),
      queryParams: { batchId: this.batchId },
    }
  }

  private getCollectionTypeCard(
    displayContentType?: NsContent.EPrimaryCategory,
  ): TCollectionCardType | null {
    switch (displayContentType) {
      case NsContent.EPrimaryCategory.PROGRAM:
      case NsContent.EPrimaryCategory.COURSE:
      case NsContent.EPrimaryCategory.MODULE:
        return 'content'
      case NsContent.EPrimaryCategory.GOALS:
        return 'goals'
      case NsContent.EPrimaryCategory.PLAYLIST:
        return 'playlist'
      default:
        return null
    }
  }

  private getCollectionTypeRedirectUrl(
    identifier: string,
    // contentType: string = '',
    displayContentType?: NsContent.EDisplayContentTypes | NsContent.EPrimaryCategory,
  ): string | null {
    let url: string | null
    const dct = (displayContentType || '').toUpperCase()
    switch (dct) {
      case NsContent.EDisplayContentTypes.PROGRAM:
      case NsContent.EDisplayContentTypes.COURSE:
      case NsContent.EDisplayContentTypes.MODULE:
      case NsContent.EDisplayContentTypes.STANDALONE_ASSESSMENT:
      case NsContent.EDisplayContentTypes.BLENDED_PROGRAM:
      case NsContent.EDisplayContentTypes.CURATED_PROGRAM:
        if (!this.forPreview) {
          url = `${this.forPreview ? '' : '/app'}/toc/${identifier}/overview`
        } else {
          url = `public/toc/${identifier}/overview`
        }
        break
      case NsContent.EDisplayContentTypes.GOALS:
        url = `/app/goals/${identifier}`
        break
      case NsContent.EDisplayContentTypes.PLAYLIST:
        url = `/app/playlist/${identifier}`
        break
      default:
        url = null
    }
    // if (contentType) {
    //   url = `${url}?primaryCategory=${contentType}`
    // }
    return url
  }

  private processCollectionForTree() {
    if (this.isPreAssessment) {
      // First try to use collection.preEnrolmentResources
      if (this.collection && this.collection.preEnrolmentResources) {
        this.collection.preEnrolmentResources.map((item: any) => {
          item['viewerUrl'] = viewerRouteGenerator(
            item.identifier,
            item?.courseCategory === 'Pre Enrolment Assessment' ? NsContent.EMimeTypes.PRACTICE_RESOURCE : item.mimeType,
            this.collection?.identifier,
            this.collection?.courseCategory,
            this.forPreview,
            this.collection.preEnrolmentResources[0]?.primaryCategory,
            '',
          )?.url
          item['collectionId'] = this.collection.identifier
          item['batchId'] = this.collection.batchId
          if (item?.courseCategory === 'Pre Enrolment Assessment') {
            item['mimeType'] = 'application/vnd.sunbird.questionset'
          }
        })
        this.nestedDataSource.data = this.collection.preEnrolmentResources
      }
      // Fallback to contentData.preEnrolmentResources when collection is not available
      else if (this.contentData && this.contentData.preEnrolmentResources) {
        this.contentData.preEnrolmentResources.map((item: any) => {
          item['viewerUrl'] = viewerRouteGenerator(
            item.identifier,
            item?.courseCategory === 'Pre Enrolment Assessment' ? NsContent.EMimeTypes.PRACTICE_RESOURCE : item.mimeType,
            this.collection?.identifier || this.contentData?.identifier || this.collectionId,
            this.collection?.courseCategory || this.contentData?.courseCategory,
            this.forPreview,
            this.contentData.preEnrolmentResources[0]?.primaryCategory,
            '',
          )?.url
          item['collectionId'] = this.collection?.identifier || this.contentData?.identifier || this.collectionId
          item['batchId'] = this.collection?.batchId || this.contentData?.batchId || this.batchId
          if (item?.courseCategory === 'Pre Enrolment Assessment') {
            item['mimeType'] = 'application/vnd.sunbird.questionset'
          }
        })
        this.nestedDataSource.data = this.contentData.preEnrolmentResources
      }

      // Expand path if we have data
      if (this.resourceId && (this.nestedDataSource.data && this.nestedDataSource.data.length > 0)) {
        of(true)
          .pipe(delay(2000))
          .subscribe(() => {
            this.expandThePath()
          })
      }
    } else {
      if (this.collection && this.collection.children) {
        this.nestedDataSource.data = this.collection.children
        // this.pathSet = new Set()
        // if (this.resourceId && this.tocMode === 'TREE') {
        if (this.resourceId) {
          of(true)
            .pipe(delay(2000))
            .subscribe(() => {
              this.expandThePath()

            })
        }
        // }
      }
    }

  }

  expandThePath() {
    if (this.collection && this.resourceId && !this.isPreAssessment) {
      const path = this.utilitySvc.getPath(this.collection, this.resourceId)
      this.pathSet = new Set(path.map((u: { identifier: any }) => u.identifier))
      this.pathSetEvent.emit({ pathSet: this.pathSet })
      // path.forEach((node: IViewerTocCard) => {
      //   this.nestedTreeControl.expand(node)
      // })
    } else if (this.isPreAssessment && this.resourceId) {
      // Handle pre-assessment path expansion with available data
      let resources = []

      if (this.collection && this.collection.preEnrolmentResources) {
        resources = this.collection.preEnrolmentResources
      } else if (this.contentData && this.contentData.preEnrolmentResources) {
        resources = this.contentData.preEnrolmentResources
      }

      if (resources.length > 0) {
        const allPaths: any = this.getAllPaths(resources, this.resourceId)

        this.pathSet = new Set(
          [].concat(...allPaths).map((node: any) => node.identifier)
        )
        this.preAssessmentPathSet = new Set(
          [].concat(...allPaths).map((node: any) => node.identifier)
        )

        this.pathSetEvent.emit({ pathSet: this.pathSet })
      }
    }
  }

  getAllPaths(nodes: any[], _id: string): any[][] {
    const paths: any[][] = []

    const dfs = (node: any, currentPath: any[]) => {
      if (!node) return

      const newPath = [...currentPath, node]

      // if (node.identifier === id) {
      paths.push(newPath)
      // }

      const children = node.children || []
      for (const child of children) {
        dfs(child, newPath)
      }
    }

    for (const node of nodes) {
      dfs(node, [])
    }

    return paths
  }


  getPath(node: any, id: string): any[] {
    const path: any = []
    this.hasPath(node, path, id)
    return path
  }

  private hasPath(node: any, pathArr: any[], id: string): boolean {
    if (node == null) {
      return false
    }
    pathArr.push(node)
    if (node.identifier === id) {
      return true
    }
    const children = node || []
    if (children.some((u: any) => this.hasPath(u, pathArr, id))) {
      return true
    }
    pathArr.pop()
    return false
  }

  getLeafNodes(node: any, nodes: any[]): any[] {
    if (Array.isArray(node)) {
      if (node.length === 0) {
        // empty array
        return nodes
      } else {
        // node is an array with items
        node.forEach((child: any) => {
          this.getLeafNodes(child, nodes)
        })
      }
    } else if (node) {
      // node is a single object
      nodes.push(node)
    }

    return nodes
  }

  minimizenav() {
    this.hidenav.emit(false)
  }
}
