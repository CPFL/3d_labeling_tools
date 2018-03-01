# Label Tool APIs

## BBox

### Event Handler
 - onAdd
This function is called when bbox add functions are called. Return value will be added to the bbox list.

```
bboxes.onAdd(dataType, function(index, cls, params) {
  ...
  return bboxObject;
});
```

You should set the same keys for params when you use BBox APIs. You can ignore this if you have nothing to do.

 - onSelect
This function is called when bbox select functions are called.

```
bboxes.onSelect(dataType, function(newIndex, oldIndex) {
  ...
});
```

 - onRemove
This function is called when bbox remove functions are called. Remove bbox in this function.

```
bboxes.onRemove(dataType, function(index) {
  var bbox = bboxes.get(index, dataType);
  bbox[key1].remove();
  bbox[key2].remove();
  ...
});
```


 - onChangeClass
This function is called when bbox change class functions are called. You can ignore this if you have nothing to do.

```
onChangeClass(dataType, function(index) {
  ...
});
```

### API Functions
| Function                       | Description
|-----------------------|----------------------------
| **get(index, dataType)** | return bboxes[index][dataType] |
| **set(index, dataType, params, cls)** | bboxes[index][dataType] := bboxes.onAdd(index, dataType, params). cls is an option
| **getTarget(dataType)** | return bboxes[targetIndex][dataType] |
| **setTarget(dataType, params, cls)** | bboxes[targetIndex][dataType] := bboxes.onAdd(targetIndex, dataType, params). cls is an option
| **select(index, dataType)** | Change target index of bbox
| **selectNext()** | Select next bbox
| **selectTail()** | Select tail bbox
| **selectEmpty()** | Select empty ( "+" in table)
| **getTargetIndex()** | Get target index of bbox
| **exists(index, dataType)** | return true if bboxes[index][dataType] exists, and false if not
| **length()** | return the number of bboxes (= The number of table rows)
| **remove(index, dataType)** | Remove bboxes[index][dataType]
| **changeClass(index, cls)** | Change class of bboxes[index]

### Example

 - Add new bounding box with table

```
bboxes.selectEmpty();
var parameters = {
  x: 100,
  something...
}
bboxes.setTarget("PCD", parameters);
```


## Class

### Struct

```
class = {color, minSize}
```

### API Functions
| Function                       | Description
|-----------------------|----------------------------
| **target()**          | return target class
| **targetName**        | return target class name

### Example

 - Get color of "Car"

```
var color = classes['Car'].color;
```

## Label Tool Util

### Event handlers

 - onLoadData
This function is called when the data is loaded.

```
labelTool.onLoadData(dataType, function() {
  showPCDData();
  ...
});
```

 - onInitialize
This function is called at the initialization.

```
labelTool.onInitialization(dataType, function() {
  initPCD();
  ...
});
```

