import { Directive, ElementRef, HostListener, HostBinding, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/takeUntil';

const eventPathLoadScroll = [
  '$event.target.defaultView.innerHeight', '$event.target.defaultView.innerWidth',
  '$event.target.defaultView.scrollY',
  '$event.target.defaultView.scrollX'
];
const eventPathResize = [
  '$event.target.innerHeight',
  '$event.target.innerWidth',
  '$event.target.scrollY',
  '$event.target.scrollX'
];
const eventLoad = 'window:load';
const eventResize = 'window:resize';
const eventScroll = 'window:scroll';
const inViewportClass = 'class.in-viewport';
const notInViewportClass = 'class.not-in-viewport';

export interface Size {
  height: number;
  width: number;
  scrollY: number;
  scrollX: number;
}

/**
 * A simple lightweight library for Angular (2+) with no
 * external dependencies that detects when an element is within the
 * browser viewport and adds a `in-viewport` or `not-in-viewport` class
 * to the element.
 *
 * @example
 * ```
 * <p
 *  class="foo"
 *  inViewport (onInViewportChange)="myEventHandler($event)"
 *  [debounce]="300">
 *  Amet tempor excepteur occaecat nulla.
 * </p>
 * ```
 *
 * @export
 * @class InViewportDirective
 */
@Directive({
  selector: '[inViewport]'
})
export class InViewportDirective implements OnInit, OnDestroy {
  /**
   * If true means the element is in the browser viewport
   *
   * @private
   * @type {boolean}
   * @memberof InViewportDirective
   */
  private inViewport: boolean;
  /**
   * Observable that returns the size of the viewport
   *
   * @private
   * @type {Subject<Size>}
   * @memberof InViewportDirective
   */
  private viewportSize$ = new Subject<Size>();
  /**
   * Completes on component destroy lifecycle event
   * use to handle unsubscription from infinite observables
   *
   * @type {Subject<void>}
   * @memberof InViewportDirective
   */
  private ngUnsubscribe$ = new Subject<void>();
  /**
   * Emits event when `inViewport` value changes
   * @type {EventEmitter<boolean>}
   * @memberof InViewportDirective
   */
  @Output()
  public onInViewportChange = new EventEmitter<boolean>();
  /**
   * Amount of time in ms to wait for other scroll events
   * before running event handler
   *
   * @type {number}
   * @default 100
   * @memberof InViewportDirective
   */
  @Input()
  public debounce = 100;
  /**
   * Returns true if element is in viewport
   *
   * @readonly
   * @type {boolean}
   * @memberof InViewportDirective
   */
  @HostBinding(inViewportClass)
  public get isInViewport(): boolean {
    return this.inViewport;
  }
  /**
   * Returns true if element is not in viewport
   *
   * @readonly
   * @type {boolean}
   * @memberof InViewportDirective
   */
  @HostBinding(notInViewportClass)
  public get isNotInViewport(): boolean {
    return !this.inViewport;
  }
  /**
   * Creates an instance of InViewportDirective.
   * @param {ElementRef} el
   * @memberof InViewportDirective
   */
  constructor(private el: ElementRef) { }
  /**
   * Subscribe to `viewportSize$` observable which
   * will call event handler
   *
   * @memberof InViewportDirective
   */
  public ngOnInit(): void {
    this.viewportSize$
      .takeUntil(this.ngUnsubscribe$)
      .debounceTime(this.debounce)
      .subscribe((size) => this.calculateInViewportStatus(size));
  }
  /**
   * On window scroll/resize/load events
   * emit next `viewportSize$` observable value
   *
   * @param {number} height
   * @param {number} width
   * @memberof InViewportDirective
   */
  @HostListener(eventLoad, eventPathLoadScroll)
  @HostListener(eventScroll, eventPathLoadScroll)
  @HostListener(eventResize, eventPathResize)
  public eventHandler(height: number, width: number, scrollY: number, scrollX: number): void {
    const size: Size = { height, width, scrollY, scrollX };
    this.viewportSize$.next(size);
  }
  /**
   * Calculate inViewport status and emit event
   * when viewport status has changed
   *
   * @param {Size} size
   * @memberof InViewportDirective
   */
  public calculateInViewportStatus(size: Size): void {
    const el: HTMLElement = this.el.nativeElement;
    const viewportBounds = {
      top: size.scrollY,
      bottom: size.scrollY + size.height,
      left: size.scrollX,
      right: size.scrollX + size.width,
    };
    const elBounds = {
      top: el.offsetTop,
      bottom: el.offsetTop + el.offsetHeight,
      left: el.offsetLeft,
      right: el.offsetLeft + el.offsetWidth,
    };
    const oldInViewport = this.inViewport;
    this.inViewport = (
      (
        (elBounds.top >= viewportBounds.top) && (elBounds.top <= viewportBounds.bottom) ||
        (elBounds.bottom >= viewportBounds.top) && (elBounds.bottom <= viewportBounds.bottom) ||
        (elBounds.top <= viewportBounds.top) && (elBounds.bottom >= viewportBounds.bottom)
      ) &&
      (
        (elBounds.left >= viewportBounds.left) && (elBounds.left <= viewportBounds.right) ||
        (elBounds.right >= viewportBounds.left) && (elBounds.right <= viewportBounds.right) ||
        (elBounds.left <= viewportBounds.left && elBounds.right >= viewportBounds.right)
      )
    );
    if (oldInViewport !== this.inViewport) {
      this.onInViewportChange.emit(this.inViewport);
    }
  }
  /**
   * trigger `ngUnsubscribe` complete on
   * component destroy lifecycle hook
   *
   * @memberof InViewportDirective
   */
  public ngOnDestroy(): void {
    this.ngUnsubscribe$.next();
    this.ngUnsubscribe$.complete();
  }
}
