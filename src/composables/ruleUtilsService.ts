import connector from '@/models/rules/connector';
import type { RuleCondition } from '@/models/rules/ruleCondition';
import { ConditionType, FlowOperator } from '@/models/enums';

export function useRuleUtils() {

  function hasContinue(condition: RuleCondition): boolean { //if there is at least one continue return true, else false
        
    if (condition.conditionType == ConditionType.ifElse && (condition.thenOperator == FlowOperator.continue || condition.elseOperator == FlowOperator.continue)) {
        return true;
    }
    else if (condition.conditionType == ConditionType.switch) {
        for (let i = 0; i < condition.switchCases.length; i++) {
            if (condition.switchCases[i].operation == FlowOperator.continue) {
                return true;
            }
        }
    }
    return false;
  }

  function getJumpConnectors(condition: RuleCondition): connector[] {
    let jumps: connector[] = [];

    if (condition.conditionType == ConditionType.ifElse) {
        if (condition.thenOperator == FlowOperator.jump) {
            jumps.push(new connector(condition.id, condition.thenJumpTo, true));
        }

        if (condition.elseOperator == FlowOperator.jump) {
            jumps.push(new connector(condition.id, condition.elseJumpTo, true));
        }
    } else if (condition.conditionType == ConditionType.switch) {
        for (let j = 0; j < condition.switchCases.length; j++) {
            let c = condition.switchCases[j];
            if (c.operation == FlowOperator.jump) {
                jumps.push(new connector(condition.id, c.jumpTo, true));
            }
        }
    }
    return jumps;
  }

  function signum(x: number) {
    return (x < 0) ? -1 : 1;
  }

  function convertCamelCaseToStr(str: string) {
    return str.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  }

  function absolute(x: number) {
    return (x < 0) ? -x : x;
  }

  function offset(elem: any): any {
    //console.log(elem.id + " " + elem.offsetTop);
    return {
        top: elem.offsetTop,
        left: elem.offsetLeft
    };
}

function drawPath(path: any, startX: any, startY: any, endX: any, endY: any, lvl: number) {

    path.setAttribute("d", "M" + (startX + 15) + " " + startY +
        " H" + (startX - (10 * lvl)) +
        " V" + endY +
        " H" + (startX));
}

function drawPathRight(path: any, startX: any, startY: any, endX: any, endY: any, elemWidth: number, lvl: number) {

    startX = startX + (elemWidth + 25);
    endX = endX + (elemWidth + 40);
    path.setAttribute("d", "M" + (startX) + " " + startY +
        " H" + (startX + (10 * lvl) + 20) +
        " V" + endY +
        " H" + (endX));
}

function newGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function setSvgArea(svg: any, firstElem: any, lastElem: any) {
    //set area
    let firstCoord = offset(firstElem);
    let lastCoord = offset(lastElem);
    //svg.style.height = ((endCoord.top + toElem.clientHeight)) + "px";
    svg.setAttribute("height", (lastCoord.top + lastElem.clientHeight) - firstCoord.top);
    svg.setAttribute("width", ((firstCoord.left * 2) + (firstElem.clientWidth / 2)));
}

function connectElements(path: any, fromElem: any, toElem: any, svgContainer: any, lvl: number, down: boolean) {

    // get (top, left) corner coordinates of the svg container   
    var svgTop = offset(svgContainer).top;
    var svgLeft = offset(svgContainer).left;

    // get (top, left) coordinates for the two elements
    var startCoord = offset(fromElem);
    var endCoord = offset(toElem);

    // calculate path's start (x,y)  coords
    // we want the x coordinate to visually result in the element's mid point
    var startX = startCoord.left - svgLeft - 20;    // x = left offset + 0.5*width - svg's left offset
    var startY = startCoord.top + 0.5 * fromElem.clientHeight - svgTop;        // y = top offset + height - svg's top offset

    // calculate path's end (x,y) coords
    var endX = endCoord.left - svgLeft - 20;
    var endY = endCoord.top - svgTop + 0.5 * toElem.clientHeight;

    // call function for drawing the path
    if (down) {
        drawPath(path, startX, startY, endX, endY, lvl);
    }
    else {
        drawPathRight(path, startX, startY, endX, endY, fromElem.clientWidth, lvl);
    }
}

function findIndexById(id: number, arr: { id: number }[]) {
    let idx = -1;

    for (var i = 0, len = arr.length; i < len; i++) {
        if (arr[i].id == id) {
            idx = i;
            break;
        }
    }
    return idx;
}

function move(arr: any[], fromIndex: number, toIndex: number): any[] {
    while (fromIndex < 0) {
        fromIndex += arr.length;
    }
    while (toIndex < 0) {
        toIndex += arr.length;
    }
    if (toIndex >= arr.length) {
        let k = toIndex - arr.length;
        while ((k--) + 1) {
            arr.push(undefined);
        }
    }
     arr.splice(toIndex, 0, arr.splice(fromIndex, 1)[0]);  
   return arr;
}

function cloneObject(obj: any): any {
    return JSON.parse (JSON.stringify(obj));
}

function createNextIdForArray(array: {id: string}[], prefix: string = "") : string {
    
    let arraynum = array.length;
    let newId = arraynum + "";
    if(prefix != ""){
        newId = prefix + arraynum;
    }

    while(array.some(x => x.id == newId)) {
        arraynum++;
        newId = arraynum + "";
        if(prefix != ""){
            newId = prefix + arraynum;
        }
    }
    
    return newId;
}


  return {
    convertCamelCaseToStr: convertCamelCaseToStr,
    setSvgArea: setSvgArea,
    connectElements: connectElements,
    findIndexById: findIndexById,
    hasContinue: hasContinue,
    getJumpConnectors: getJumpConnectors,
  }
}