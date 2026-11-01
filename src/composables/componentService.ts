import type { IComponentElement } from "@/models/componentElement";
import { ValueType } from "@/models/enums";
import type { JsonValue } from "@/models/generated/contracts";
import { isJsonObject, valueAt } from "./jsonValue";

export function useComponentService() {
    function getElementBooleanValue(element: IComponentElement, expectedPropertyValue: string = ""): boolean {
        const value = element.report?.value;
        switch(element.reportTemplate?.type){
          case ValueType.Boolean:
            return Boolean(value);
          case ValueType.Entity:
            return getElementPropertyValue(element) === expectedPropertyValue;
          case ValueType.Number:
            return Number(value) > 0;
          case ValueType.Text:
            return value != null && value !== "";
        }
        return false;
      }

      function getElementTextValue(element: IComponentElement): string {
        switch(element.reportTemplate?.type){
          case ValueType.Text:
            return String(element.report?.value ?? "");
          case ValueType.Entity:
            return String(getElementPropertyValue(element) ?? "");
          case ValueType.Boolean:
          case ValueType.Number:
          default:
            return "";
        }
      }

      function getElementNumericValue(element: IComponentElement): number {
        const value = element.report?.value;
        // NaN when there is no number, so the dashboard shows a placeholder.
        switch(element.reportTemplate?.type){
          case ValueType.Text:
            return Number(value);
          case ValueType.Number:
            return typeof value === "number" ? value : Number.NaN;
          case ValueType.Entity:
            return Number(getElementPropertyValue(element));
          case ValueType.Boolean:
            return value ? 1 : 0;
          default:
            return 0;
        }
      }

      /**
       * An element property (see the *ElementProperties classes), or, when the property names a
       * member of an entity report as "{member}", that member of the current report. T is the shape
       * the caller expects; it is not checked at run time.
       */
      function getElementPropertyValue<T extends JsonValue = JsonValue>(element: IComponentElement, entityPropertyName: string = "value"): T | undefined {
        const propertyName = getElementValuePropertyName(element, entityPropertyName);
        const value = propertyName != ""
          ? valueAt(element.report?.value, [propertyName])
          : element.properties?.[entityPropertyName];
        return value as T | undefined;
      }

      function getElementValuePropertyName(element: IComponentElement, entityPropertyName: string = "value"): string {
        
        if(element.reportTemplate?.type != ValueType.Entity || element.properties == undefined)
          return "";

        const propertyName = element.properties[entityPropertyName];
        if(typeof propertyName !== "string" || propertyName == "")
          return "";
        
        if(propertyName.startsWith("{") && propertyName.endsWith("}")) {
            return propertyName.substring(1, propertyName.length-1);
        } else {
          return propertyName;
        }
      }

      function getPreviousNumericValues(element: IComponentElement): number[] {
        let values: JsonValue[] | null = [];
        if(element.reportTemplate?.type == ValueType.Number) {
          if(element.previousReportsAsc != undefined) {
            values = getArrayMap(element.previousReportsAsc, "value");
          }
        } if(element.reportTemplate?.type == ValueType.Entity) {
          const propertyName = getElementValuePropertyName(element);
          if(propertyName != "")
            values = getArrayMap(element.previousReportsAsc, "value." + propertyName);
        }

        return values == null ? [] : values.map(v => Number(v));
      }

      /** The value at a dotted path ("value.temperature") of each report; null when none has it. */
      function getArrayMap(reports: { value: JsonValue }[] | undefined, path: string): JsonValue[] | null  {
        if(reports == undefined)
          return null;
        const [first, ...rest] = path.split(".");
        const map = reports
          .map(report => first == "value" ? valueAt(report.value, rest) : undefined)
          .filter((e): e is JsonValue => e !== undefined);
        
        return map.length > 0 ? map : null;
      }

      function formatDate(date: Date) {
        const d = new Date(date);
        const year = d.getFullYear();
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
    
        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;
        
        const now = new Date();
       
        if(d.getDate() != now.getDate() || d.getMonth() != now.getMonth() || d.getFullYear() != now.getFullYear())
          return [day, month, year ].join('.') + " " + String(d.getHours()).padStart(2, '0')+":" + String(d.getMinutes()).padStart(2, '0');
    
        return String(d.getHours()).padStart(2, '0')+ ":" + String(d.getMinutes()).padStart(2, '0') +":" +String(d.getSeconds()).padStart(2, '0');
    }

    function timeStampToDate(timestamp: number): Date {
      const d = new Date(0); // The 0 there is the key, which sets the date to the epoch
      d.setUTCSeconds(timestamp);
      return d;
    }

    function areEqual(object1: JsonValue | undefined, object2: JsonValue | undefined): boolean {
      if (!isJsonObject(object1) || !isJsonObject(object2))
        return Object.is(object1, object2);

      const keys1 = Object.keys(object1);
      const keys2 = Object.keys(object2);
      if (keys1.length !== keys2.length) {
        return false;
      }
      for (const key of keys1) {
        const val1 = object1[key];
        const val2 = object2[key];
        const areObjects = isJsonObject(val1) && isJsonObject(val2);
        if (
          areObjects && !areEqual(val1, val2) ||
          !areObjects && val1 !== val2
        ) {
          return false;
        }
      }
      return true;
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