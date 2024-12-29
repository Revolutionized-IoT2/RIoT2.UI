import type { IComponentElement } from "@/models/componentElement";
import { ValueType } from "@/models/enums";

export function useComponentService() {
    function getElementBooleanValue(element: IComponentElement, expectedPropertyValue: string = ""): boolean {
        switch(element.reportTemplate?.type){
          case ValueType.Boolean:
            return element.report?.value;
          case ValueType.Entity:
            return getElementPropertyValue(element) === expectedPropertyValue;
          case ValueType.Number:
            return element.report?.value > 0;
          case ValueType.Text:
            return element.report?.value != null &&  element.report?.value != "";
        }
        return false;
      }

      function getElementTextValue(element: IComponentElement): string {
        switch(element.reportTemplate?.type){
          case ValueType.Text:
            return element.report?.value;
          case ValueType.Entity:
            return getElementPropertyValue(element);
          case ValueType.Boolean:
          case ValueType.Number:
          default:
            return "";
        }
        return "";
      }

      function getElementNumericValue(element: IComponentElement): number {
        switch(element.reportTemplate?.type){
          case ValueType.Text:
            return +element.report?.value;
          case ValueType.Entity:
            return +getElementPropertyValue(element);
          case ValueType.Boolean:
            return element.report?.value ? 1 : 0;
          case ValueType.Number:
            return element.report?.value;
          default:
            return 0;
        }
        return 0;
      }

      function getElementPropertyValue(element: IComponentElement, entityPropertyName: string = "value"): any {
        try{
          let propertyName = getElementValuePropertyName(element, entityPropertyName);

          if(propertyName != "") {
              return element.report?.value[propertyName];
          } else {
            return element.properties[entityPropertyName];
          }
        }catch {
          console.log("Not able to find " + entityPropertyName + " from element");
        }
      }

      function getElementValuePropertyName(element: IComponentElement, entityPropertyName: string = "value"): string {
        
        if(element.reportTemplate?.type != ValueType.Entity || element.properties == undefined)
          return "";

        let propertyName = element.properties[entityPropertyName];
        if(propertyName == undefined || propertyName == "")
          return "";
        
        if(element.properties[entityPropertyName].startsWith("{") &&
          element.properties[entityPropertyName].endsWith("}")) {
            return propertyName.substring(1, propertyName.length-1);
        } else {
          return propertyName;
        }
      }

      function getPreviousNumericValues(element: IComponentElement): number[] {
        let values: number[] |null = [];
        if(element.reportTemplate?.type == ValueType.Number) {
          if(element.previousReportsAsc != undefined) {
            values = getArrayMap<number>(element.previousReportsAsc, "value");
          }
        } if(element.reportTemplate?.type == ValueType.Entity) {
          let propertyName = getElementValuePropertyName(element);
          if(propertyName != "")
            values = getArrayMap<number>(element.previousReportsAsc, "value." + propertyName);
        }

        if(values == null)
          return [];
        else 
          return values;
      }

      function getDescendantProp(obj: any, desc: string) {
        if(desc.indexOf('.') == -1)
          return obj[desc];

        var arr: any[] = desc.split(".");
        while(arr.length && (obj = obj[arr.shift()]));
        return obj;
      }

      function getArrayMap<T>(objArray: any[] | undefined, propertyName: string): T[] | null  {
        if(objArray == undefined)
          return null;
        let map = objArray.map<T>(a => getDescendantProp(a, propertyName));

        map = map.filter(function(e) {
          return e !== undefined;
        });
        
        if(map.length > 0)
          return map;
        else
          return null;
      }

      function formatDate(date: Date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
    
        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;
        
        let now = new Date();
       
        if(d.getDate() != now.getDate() || d.getMonth() != now.getMonth() || d.getFullYear() != now.getFullYear())
          return [day, month, year ].join('.') + " " + String(d.getHours()).padStart(2, '0')+":" + String(d.getMinutes()).padStart(2, '0');
    
        return String(d.getHours()).padStart(2, '0')+ ":" + String(d.getMinutes()).padStart(2, '0') +":" +String(d.getSeconds()).padStart(2, '0');
    }

    function timeStampToDate(timestamp: number): Date {
      var d = new Date(0); // The 0 there is the key, which sets the date to the epoch
      d.setUTCSeconds(timestamp);
      return d;
    }

    function areEqual(object1: any, object2: any) {
      const keys1 = Object.keys(object1);
      const keys2 = Object.keys(object2);
      if (keys1.length !== keys2.length) {
        return false;
      }
      for (const key of keys1) {
        const val1 = object1[key];
        const val2 = object2[key];
        const areObjects = isObject(val1) && isObject(val2);
        if (
          areObjects && !areEqual(val1, val2) ||
          !areObjects && val1 !== val2
        ) {
          return false;
        }
      }
      return true;
    }

    function isObject(object: any) {
      return object != null && typeof object === 'object';
    }

      return {
        getElementBooleanValue: getElementBooleanValue,
        getElementTextValue: getElementTextValue,
        getElementNumericValue: getElementNumericValue,
        getElementPropertyValue: getElementPropertyValue,
        getElementPreviousNumericValues: getPreviousNumericValues,
        getElementProperty: getElementValuePropertyName,
        arrayMap: getArrayMap,
        formatDate: formatDate,
        timeStampToDate: timeStampToDate,
        areEqual: areEqual
      };
}