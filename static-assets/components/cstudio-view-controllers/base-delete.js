/*
 * Copyright (C) 2007-2019 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * File: schedule-for-delete.js
 * Component ID: viewcontroller-basedelete
 * @author: Roy Art
 * @date: 05.01.2011
 **/
(function(){

    var BaseDelete,
        Event = YAHOO.util.Event,
        Dom = YAHOO.util.Dom,

        eachfn = CStudioAuthoring.Utils.each;

    CStudioAuthoring.register("ViewController.BaseDelete", function() {
        CStudioAuthoring.ViewController.BaseDelete.superclass.constructor.apply(this, arguments);
    });

    BaseDelete = CStudioAuthoring.ViewController.BaseDelete;
    YAHOO.extend(BaseDelete, CStudioAuthoring.ViewController.Base, {

        actions: [".cancel"],
        events: ["submitComplete","submitStart","submitEnd","itemRender"],
        startup: ["extend"],

        extend: function() {
            this.events = this.events.concat(this.constructor.superclass.events);
            this.actions = this.actions.concat(this.constructor.superclass.actions);
        },

        loadDependencies: function(selection) {
            var _this = this,
                loadFn;
            loadFn = function() {
                _this.getComponent("table.item-listing tbody").innerHTML =
                        '<tr><td colspan="3"><i>Loading, please wait&hellip;</i></td></tr>';
                CStudioAuthoring.Service.lookupContentDependencies(
                    CStudioAuthoringContext.site,
                    selection, {
                    success: function(dependencies) {
                        dependencies = dependencies.items;
                        _this.renderItems(dependencies);
                        _this.disablePageReferences(dependencies);
                        _this.checkSelectedItems(selection);

                        //set focus on submit/delete button
                        var oSubmitBtn = _this.getComponent(_this.actions[0]);
                        if (oSubmitBtn) {
                            CStudioAuthoring.Utils.setDefaultFocusOn(oSubmitBtn);
                        }
                    },
                    failure: function(){
                        _this.getComponent("table.item-listing tbody").innerHTML =
                                '<tr><td colspan="3">Unable to load dependencies. <a class="retry-dependency-load" href="javascript:">Try again</a></td></tr> ';
                        Event.addListener(_this.getComponent("a.retry-dependency-load"), "click", loadFn);
                    }
                });
            }
            loadFn();

            $(document).on("keyup", function(e) {
                if (e.keyCode === 10 || e.keyCode === 13) {	// enter
                    $("#deleteBtn").click();
                }

                if (e.keyCode === 27) {	// esc
                    _this.end();
                    $(document).off("keyup");
                }
            });
        },
        checkSelectedItems: function(selection) {
            eachfn(selection, function(i, item){
                var uri = item.browserUri || item.uri,
                    el = Dom.get(uri);
                el.checked = true;
                eachfn(this.getComponents('input[parentid="'+uri+'"]'), function(i, e){
                    if (!e.disabled) {
                        e.checked = true;
                    }
                }, this);
            }, this);
            this.updateSubmitButton();
        },
        disablePageReferences: function(items) {
            eachfn(items, function(i, item){
                if (item.pages && item.pages.length >= 1) {
                    eachfn(item.pages, function(i, refItem){
                        var uri = refItem.browserUri,
                            el = Dom.get(uri);
                        if (el) {
                            el.checked = false;
                            el.disabled = true;
                        }
                    }, this);
                }
            }, this);
        },
        createCalendar: function() {
            // Get the date-picker field, context of the calendar
            var input = this.getComponent("input.date-picker"),
                contextEl = this.cfg.getProperty("context"),
                calId = CStudioAuthoring.Utils.getScopedId("calendar"),
                wrpId = CStudioAuthoring.Utils.getScopedId("calendarWrp"),
                calendar,
                overlay;
            // Create an overlay that will hold the calendar
            overlay = this.calendarWrp = new YAHOO.widget.Overlay(wrpId, {
                context: [input, "tl", "bl"],
                draggable: false,
                visible: false,
                width: "221px",
                close: false
            });
            // Create an element inside the overlay for the calendar to render
            overlay.setBody('<div id="' + calId + '" style="margin:0"></div>');
            Dom.setStyle(overlay.body, "padding", "0");
            overlay.render(contextEl);

            var todaysDate = new Date();
            todaysDate = (todaysDate.getMonth()+ 1) + "/" + todaysDate.getDate()+"/" + todaysDate.getFullYear();
            // Create the calendar
            calendar = this.calendar = new YAHOO.widget.Calendar(calId, {
                iframe: false,
                mindate: todaysDate
            });

            calendar.render(contextEl);
            // Method to hide calendar when clicked outside of it
            var fn = function(e) {
                var el = Event.getTarget(e),
                    overlayEl = overlay.element;
                if (el != overlayEl && !Dom.isAncestor(overlayEl, el) && el != input)
                    overlay.hide();
            }
            // Show the calendar when the text field is focused
            Event.addListener(input, "focus", function(){
                overlay.align();
                overlay.show();
                Dom.removeClass(overlay.element, "show-scrollbars");
                Event.on(document, "click", fn);
            });
            var over_cal = false; // flag for blur events
            Event.addListener(overlay.body, "mouseover", function() {
                over_cal = true;
            });
            Event.addListener(overlay.body, "mouseclick", function() {
                over_cal = true;
            });
            Event.addListener(overlay.body, "mouseout", function() {
                over_cal = false;
            });
            // Hide the calendar when the text field is focus out
            Event.addListener(input, "blur", function(){
                if (!over_cal) {
                    overlay.hide();
                }
            });
            // Set selected date value to the text field
            var _this = this;
            calendar.selectEvent.subscribe(function(){
                var oDate = calendar.getSelectedDates()[0],
                    datefield = this.getComponent("input.date-picker"),
                    timefield = this.getComponent("input.time-picker");
                datefield.value = [oDate.getMonth()+1, oDate.getDate(), oDate.getFullYear()].join("/");
                overlay.hide();
                Event.removeListener(document, "click", fn);
            }, null, this);
        },
        initCheckRules: function() {
            Event.addListener(this.getComponent("table.item-listing"), "click", function(e){
                var el = (e.target),
                    tag = el.tagName.toLowerCase();
                if (tag == "input") {
                    var parentid = el.getAttribute("parentid"),
                        isParent = !parentid;
                    if (isParent && el.checked) {
                        eachfn(
                            this.getComponents('input[parentid="'+el.id+'"]'),
                            function(i, input) {
                                if(!input.disabled) {
                                    input.checked = true;
                                }
                            }, this);
                    } else if(el.checked) {
                        var checks = this.getComponents("input[type=checkbox].item-check");
                        eachfn(checks, function(i, check){
                            var parsedJson = JSON.parse(decodeURIComponent(check.getAttribute("json")));
                            if (parsedJson.parentPath && parsedJson.parentPath != "") {
                                var parentPath = parsedJson.parentPath;
                                var parentElNode = this.getComponents('input[id="'+parentPath+'"]');
                                if (parentElNode && parentElNode.length == 1 && parentElNode[0] == el) {
                                    check.checked = true;
                                }
                            }
                        }, this);
                    } else if(!el.checked) {
                        var parsedJson = JSON.parse(decodeURIComponent(el.getAttribute("json")));
                        if (parsedJson.parentPath && parsedJson.parentPath != "") {
                            var parentPath = parsedJson.parentPath;
                            var parentElNode = this.getComponents('input[id="'+parentPath+'"]');
                            if (parentElNode && parentElNode.length == 1 && parentElNode[0].checked) {
                                el.checked = true;
                            }
                        }
                    }
                    this.updateSubmitButton();
                }
            }, null, this);
        },
        updateSubmitButton: function() {
            var checks = this.getComponents("input[type=checkbox].item-check"),
                someChecked = false;
            eachfn(checks, function(i, check){
                if (check.checked && !check.disabled) {
                    someChecked = true;
                    return false;
                }
            });
            if (someChecked) {
                this.enableActions(this.actions[0]);
            } else {
                this.disableActions(this.actions[0]);
            }
        },

        cancelActionClicked: function(btn, evt) {
            this.end();
            $(document).off("keyup");
        }
    });

    CStudioAuthoring.Env.ModuleMap.map("viewcontroller-basedelete", BaseDelete);

})();
