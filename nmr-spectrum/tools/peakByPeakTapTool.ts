/************************************************
 * Title: Bokeh                                 *
 * Code version: 12.14                          *
 * Availability: https://github.com/bokeh/bokeh *
 ************************************************/

import {SelectTool, SelectToolView} from "models/tools/gestures/select_tool"
import * as p from "core/properties"
import {isFunction} from "core/util/types"
import {Geometry, PointGeometry} from "core/geometry"
import {DataSource} from "models/sources/data_source"

export interface BkEv {
  bokeh: {
    sx: number
    sy: number
  }
  srcEvent: {
    shiftKey?: boolean
  }
}

export class PeakByPeakTapToolView extends SelectToolView {
  model: PeakByPeakTapTool

  _tap(e: BkEv): void {
    const {sx, sy} = e.bokeh

    const geometry: PointGeometry = {
      type: 'point',
      sx: sx,
      sy: sy,
    }
    const append = e.srcEvent.shiftKey || false
    this._select(geometry, true, append)
  }

  _select(geometry: PointGeometry, final: boolean, append: boolean): void {
    const callback = this.model.callback

    const cb_data: {
      geometries: Geometry,
      source: DataSource | null,
    } = {
      geometries: geometry,
      source: null,
    }

    if (this.model.behavior == "select") {
      const renderers_by_source = this._computed_renderers_by_data_source()

      for (const id in renderers_by_source) {
        const renderers = renderers_by_source[id]
        const sm = renderers[0].get_selection_manager()
        const r_views = renderers.map((r) => this.plot_view.renderer_views[r.id])
        const did_hit = sm.select(r_views, geometry, final, append)

        if (did_hit && callback != null) {
          cb_data.source = sm.source
          if (isFunction(callback))
            callback(this, cb_data)
          else
            callback.execute(this, cb_data)
        }
      }

      this._emit_selection_event(geometry)
      this.plot_view.push_state('tap', {selection: this.plot_view.get_selection()})
    } else {
      for (const r of this.computed_renderers) {
        const sm = r.get_selection_manager()
        const did_hit = sm.inspect(this.plot_view.renderer_views[r.id], geometry)

        if (did_hit && callback != null) {
          cb_data.source = sm.source
          if (isFunction(callback))
            callback(this, cb_data)
          else
            callback.execute(this, cb_data)
        }
      }
    }
  }
}

export namespace PeakByPeakTapTool {
  export interface Attrs extends SelectTool.Attrs {
    behavior: "select" | "inspect"
    callback: any // XXX
  }

  export interface Opts extends SelectTool.Opts {}
}

export interface PeakByPeakTapTool extends PeakByPeakTapTool.Attrs {}

export class PeakByPeakTapTool extends SelectTool {

  constructor(attrs?: Partial<PeakByPeakTapTool.Attrs>, opts?: PeakByPeakTapTool.Opts) {
    super(attrs, opts)
  }

  static initClass() {
    this.prototype.type = "PeakByPeakTapTool"
    this.prototype.default_view = PeakByPeakTapToolView

    this.define({
      behavior: [ p.String, "select" ], // TODO: Enum("select", "inspect")
      callback: [ p.Any ], // TODO: p.Either(p.Instance(Callback), p.Function) ]
    })
  }

  tool_name = "Peak By Peak"
  icon = "my_icon_peak_by_peak"
  event_type = "tap"
  default_order = 10
}

PeakByPeakTapTool.initClass()
