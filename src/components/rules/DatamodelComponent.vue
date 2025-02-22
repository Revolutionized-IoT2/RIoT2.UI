<script setup lang="ts">
import { ValueType } from '@/models/enums';
import PlaceholderItem from '@/models/placeholderItem';
import { Rule } from '@/models/rules/rule';
import { computed, onMounted, ref } from 'vue';

//import type { ContextMenuItem } from '@/models/contextMenuItem';
const emit = defineEmits<{
    readInputClicked: [void],
    modelUpdated: [any, ValueType]
}>();

export interface Props {
    datamodel: any,
    labeltext: string,
    expanded?: boolean,
    editable?: boolean,
    readInput?: boolean,
    expandable?: boolean,
    placeholders?: PlaceholderItem[],
    allowedTypes?: ValueType[]
};

const props = withDefaults(defineProps<Props>(), {
    expanded: false,
    editable: false,
    readInput: false,
    expandable: true,
    placeholders: () => [],
    allowedTypes: () => [],
});

const expandedState = ref(false);
const showDialog = ref(false);
const editMode = ref(false);
const jsonErrors = ref("");
const editJson = ref("");
const type = ref(ValueType.Text);
const selectedPlaceholder = ref<PlaceholderItem | null>(null);

const dataLang = computed(() => {
    return ValueType[getValueType(props.datamodel)];
});

function convertToType(val: any, type: ValueType): any {
    switch(type) {
        case ValueType.Boolean: return val.toString().toLocaleLowerCase() == "true";
        case ValueType.Number: return Number(val);
        case ValueType.Entity: 
        case ValueType.TextArray: return JSON.parse(val.toString());
        case ValueType.Text:
        default: return val.toString();
    }
}

function getValueType(val: any): ValueType {

    if(typeof val === 'object')
        return ValueType.Entity;

    if(Array.isArray(val))
        return ValueType.TextArray;

    if (typeof val == "boolean") return ValueType.Boolean;
    if (typeof val == "number") return ValueType.Number;

    if(!Number.isNaN(Number(val)))
        return ValueType.Number; 

    if(val?.toString()?.toLowerCase() == "false" || val?.toString()?.toLowerCase() == "true")
        return ValueType.Boolean;
    
    return ValueType.Text;
}

const data = computed(() => {
    return formatCodeBlock(props.datamodel)
});

function isPrimitive() {
    if(type.value === ValueType.Boolean || 
            type.value === ValueType.Text || 
            type.value === ValueType.Number)
            return true;

    return false;
}

onMounted(() => {
    expandedState.value = props.expanded;
    type.value = getValueType(props.datamodel);
    
});


function clickView() {
    if(props.editable)
        showDialog.value = true;
}

function readInputClick() {
    emit('readInputClicked');
}

function closeDialog() {

    jsonErrors.value = "";
    editJson.value = "";
    showDialog.value = false;
    editMode.value = false;
}

const valueTypes = computed(() => {

    let allTypes = [{name: "Boolean", value: ValueType.Boolean},
                    {name: "Entity", value: ValueType.Entity},
                    {name: "Number", value: ValueType.Number},
                    {name: "Text", value: ValueType.Text},
                    {name: "TextArray", value: ValueType.TextArray}];
    
    if(props.allowedTypes.length == 0) {
        return allTypes;
    } else {
        return allTypes.filter(item => (props.allowedTypes.includes(item.value)));
    }
});

function setSelectedVariableDefault(type: ValueType): any {
  switch(type) {
    case ValueType.Boolean: return false;
    case ValueType.Text: return "";
    case ValueType.Number: return 0;
    case ValueType.Entity: return "{}";
    case ValueType.TextArray: return "['','']";
  }
}

function editModeClick() {
    jsonErrors.value = "";

    if(!editMode.value) {
        if(isPrimitive()) {
            editJson.value = props.datamodel;
        } else {
            editJson.value = JSON.stringify(props.datamodel, undefined, 2);
        }
        editMode.value = true;
    } else {
        try{
            let obj = convertToType(editJson.value, type.value);
            emit('modelUpdated', obj, type.value);
            closeDialog();
        } catch(e) {
                jsonErrors.value = "" + e;
        }
    }
}

function valueToJson():string {
    if(isPrimitive()) {
            return props.datamodel;
        } else {
            return JSON.stringify(props.datamodel, undefined, 2);
        }
}

function formatCodeBlock(json: string) {
    if(json == null)
        return "";
        
    json = JSON.stringify(json, undefined, 2);
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    json = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });

    //{trigger-value}, {time}, {date}, {weekday}
    //
    //reformat placeholders when viewwing
    props.placeholders.forEach((p) => {
        json = json.replace('"'+p.placeholder+'"', '<i style="color:blue;border-style: solid;border-color: blue;">'+p.name+'</i>');
    });

    //console.dir(json);
    return json;
}

function copyCode() {
    navigator.clipboard.writeText(valueToJson());
}

function copyPlaceHolder() {
    if(selectedPlaceholder.value == null)
        return;

    navigator.clipboard.writeText(selectedPlaceholder.value.placeholder);
}

</script>

<template>
    <div>
        <v-card-actions class="pl-0 pr-0 h-40">
         <v-card-subtitle class="pl-0 v-label--active">{{labeltext}}
            <v-icon size="x-small" @click="copyCode" class="ml-4">content_copy</v-icon>
         </v-card-subtitle>
          <v-spacer></v-spacer>
        <v-btn v-if="expandable" icon @click="expandedState = !expandedState" class="pr-0 pl-0" small>
            <v-icon class="pl-0">{{ expandedState ? 'arrow_drop_up' : 'arrow_drop_down' }}</v-icon>
        </v-btn>
        </v-card-actions>
        <v-expand-transition>
        <div v-show="expandedState || !expandable" @click="clickView">
            <v-card-text class="pa-0 clickable">
               <div class="code-block">
            <div class="content">
                <pre class="highlight pa-3">
                    <code :data-lang="dataLang" v-html="data" /> 
                </pre>
            </div>
        </div>
            </v-card-text>
        </div>
        </v-expand-transition>
        <v-dialog v-model="showDialog" width="500">
        <v-card>
            <v-card-title class="headline grey lighten-2" primary-title>
                {{labeltext}}
             </v-card-title>
                <v-card-text v-if="editMode">
                    <v-select
                        v-model="type"
                        :items="valueTypes"
                        item-title="name"
                        item-value="value"
                        label="Type"
                        @update:model-value="editJson = setSelectedVariableDefault(type)"
                      />
                    
                    <v-autocomplete
                        v-if="type == ValueType.Entity && props.placeholders.length > 0"
                        v-model="selectedPlaceholder"
                        :items="props.placeholders"
                        color="primary"
                        item-title="name"
                        item-value="placeholder"
                        label="Available placeholders"
                        hint="To use placeholder, copy its value and paste to JSON"
                        prepend-icon="find_in_page"
                        return-object>

                    <template v-slot:chip="{ props, item }">
                      <div v-bind="props" v-if="item != null">
                        {{ item.raw.name }} 
                        <v-chip size="x-small" class="ma-2" label v-for="(tag) in item.raw.tags">
                        {{ tag }}
                        </v-chip>
                      </div>
                    </template>
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props" :title="item.raw.name">
                      <v-chip size="x-small" class="ma-1" label v-for="(tag) in item.raw.tags">
                        {{ tag }}
                      </v-chip>
                    </v-list-item>
                   </template>
                   <template v-slot:append>
                        <v-icon
                            color="info"
                            icon="content_copy"
                            @click="copyPlaceHolder"
                        ></v-icon>
                    </template>
                  </v-autocomplete>

                    <div class="content">
                        <v-textarea
                        v-model="editJson"
                        :hint="jsonErrors"
                        persistent-hint
                        ></v-textarea>
                    </div>
                </v-card-text>
                <v-card-text v-else>
                    <div class="content">
                        <pre class="highlight pl-2">
                            <code :data-lang="dataLang" v-html="data" />
                        </pre>
                    </div>
                </v-card-text>
                <v-divider></v-divider>
                <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn v-if="editable" color="blue" variant="text" @click="editModeClick">
                            <v-icon>edit</v-icon>
                        {{editMode?'save':'edit'}}
                    </v-btn>
                <v-btn v-if="readInput" color="blue" variant="text" @click="readInputClick">
                            <v-icon>replay</v-icon>
                        read
                    </v-btn>
                <v-btn color="blue" variant="text" @click="closeDialog">
                    <v-icon>close</v-icon>
                    close
                </v-btn>
                </v-card-actions>
            </v-card>
            </v-dialog>
    </div>
</template>
<style>
.h-40{
  height:40px;
}
span.key {
    color: #7D9029;
}

span.string {
    color: #BA2121;
}

code {
    background-color: #f7f7f8 !important;
    color: #bd4147 !important;
    -webkit-box-shadow: none !important; 
    box-shadow:none !important;
    left: 0;
    margin-top: .425rem;
        display: block !important; 
}

p a > code:hover{
    color: rgba(0,0,0,.9);
}

code[data-lang]:before{
    position: absolute;
    top: .425rem;
    right: .5rem;
    display: none;
    color: #999;
    content: attr(data-lang);
    text-transform: uppercase;
    font-size: .75em;
    line-height: 1;
}

.model-code:hover code[data-lang]:before{
    display: block;
}

.code-block pre{
    background: #f7f7f8;
    -webkit-border-radius: 4px;
            border-radius: 4px;
    word-wrap: break-word;
    font-size: .8125em;
}

.code-block > .content{
    position: relative;
    line-height: .6rem;
}

.code-block code[data-lang]:before{
    position: absolute;
    top: .425rem;
    right: .5rem;
    display: none;
    color: #999;
    content: attr(data-lang);
    text-transform: uppercase;
    font-size: .9em;
    line-height: 1;
}

.code-block:hover code[data-lang]:before{
    display: block;
}
</style>