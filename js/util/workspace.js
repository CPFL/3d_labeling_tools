// TODO:
//   implement packAnnotation()
//	 implement JPEG feature
//   implement archiveWorkFiles()
//   check result[]

//   ...// Instantiate with WorkSpace("pcd")
class WorkSpace {
    constructor(dataType) {
	this.classColor = {car: "blue", motorbike: "green", pedestrian: "red", bus: "yellow", truck: "white", cyclist: "orange", train: "cyan", obstacle: "purple", stop_signal: "red", wait_signal: "yellow", go_signal: "green"};
	this.labelId = -1;
	this.workBlob = ''; // Base url of blob
	this.curFile = 0; // Base name of current file
	this.fileList = [];
	this.dataType = dataType; // JPEG or PCD
	this.originalSize = [0, 0]; // Original size of jpeg image
	this.bboxes = []; // Bounding boxes
	this.results = []; // Replacement of azure blob for output
	this.originalBboxes = []; // For checking modified or not
    }

    // Use prototype? --->

    // Visualize 2d and 3d data
    showData() {
	if (this.dataType == "JPEG") {
	    var img_url = this.workBlob + "/JPEGImages/" + this.fileList[this.curFile] + ".jpg";
	    img = paper.image(img_url, 0, 0, c.width, c.height);
	    imageBox.value = (this.curFile + 1) + "/" + this.fileList.length; //TODO
	    addEventsToImage();
	    this.getAnnotations();
	} else {
	    parameters.flame = this.curFile;
	    var img_url = this.workBlob + '/JPEGImages/'
			+ this.fileList[this.curFile] + '.jpg';
	    THREE.ImageUtils.crossOrigin = '';
	    var image =  THREE.ImageUtils.loadTexture(img_url);
	    var material = new THREE.MeshBasicMaterial({map: image});
	    var geometry = new THREE.PlaneGeometry(4, 3);
	    var image_plane = new THREE.Mesh(geometry, material);
	    var pcd_loader = new THREE.PCDLoader();
	    var pcd_url = this.workBlob + '/PCDPoints/'
			+ this.fileList[this.curFile] + '/all.pcd';
	    pcd_loader.load(pcd_url, function (mesh) {
		scene.add(mesh);
		ground_mesh = mesh;
		/* var center = mesh.geometry.boundingSphere.center;*/
	    });
	    var image_mat = MaxProd(CameraExMat, [0, 0, 2, 1]);
	    image_plane.position.x = image_mat[0];
	    image_plane.position.y = image_mat[1];
	    image_plane.position.z = image_mat[2];
	    image_plane.rotation.y = -Math.PI/2;
	    image_plane.rotation.x = Math.PI/2;
	    scene.add(image_plane);
	    image_array = [];
	    image_array.push(image_plane);
	    image_2d = new Image();
	    image_2d.crossOrigin = 'Anonymous'
	    image_2d.src = this.workBlob + '/JPEGImages/'
			 + this.fileList[this.curFile] + '.jpg?' + new Date().getTime();
	    image_2d.onload = function() {
		ctx.drawImage(image_2d, 0, 0);
	    }
	    if(parameters.image_checkbox==false){
	    	image_array[0].visible = false;
	    }
	    this.getAnnotations();
	}
    }

    // Set values to this.bboxes from annotations
    loadAnnotations(annotations) {
	if (this.dataType == "JPEG") {
	    for (var i = 0; i < this.bboxes.length; ++i) {
		this.bboxes[i].remove();
	    }
	    this.bboxes = [];
	    for (var i in annotations) {
		if (i != "remove") {
		    var xmin = annotations[i].left;
		    var ymin = annotations[i].top;
		    var xmax = annotations[i].right;
		    var ymax = annotations[i].bottom;
		    var name = annotations[i].label;
		    var minPos = convertPositionToCanvas(xmin, ymin);
		    var maxPos = convertPositionToCanvas(xmax, ymax);
		    this.bboxes.push(paper.rect(minPos[0], minPos[1],
						maxPos[0] - minPos[0],
						maxPos[1] - minPos[1]));
		    this.bboxes[this.bboxes.length - 1].attr({stroke: this.classColor[name],
    							      "stroke-width": 3});
		    this.bboxes[this.bboxes.length - 1].data("class", name);
		}
	    }
	} else {
	    this.bboxes = [];
	    for (var i in annotations) {
		if (i != "remove") {
		    var readfile_mat =
			MaxProd(CameraExMat,[parseFloat(annotations[i].x),
					     parseFloat(annotations[i].y),
					     parseFloat(annotations[i].z),
					     1]);
		    var readfile_parameters = {
			x : readfile_mat[0],
			y : -readfile_mat[1],
			z : readfile_mat[2],
			delta_x : 0,
			delta_y : 0,
			delta_z : 0,
			width : parseFloat(annotations[i].width),
			height : parseFloat(annotations[i].height),
			depth : parseFloat(annotations[i].length),
			yaw : parseFloat(annotations[i].rotation_y),
			numbertag : parameters.i + 1,
			label : annotations[i].label
		    };
		    addbbox(readfile_parameters);
		}
	    }
	}
	this.originalBboxes = this.bboxes.concat();
	/* main();*/
    }

    // Create annotations from this.bboxes
    packAnnotations() {
	if (this.dataType == "JPEG") {
	    var annotations = [];
	    for (var i = 0; i < this.bboxes.length; ++i) {
		var bbox = this.bboxes[i];
		var minPos = convertPositionToFile(bbox.attr("x"), bbox.attr("y"));
		var maxPos = convertPositionToFile(bbox.attr("x") + bbox.attr("width"),
						   bbox.attr("y") + bbox.attr("height"));
		annotations.push({label: bbox.data("class"),
				  truncated: 0,
				  occluded: 0,
				  alpha: 0,
				  left: minPos[0],
				  top: minPos[1],
				  right: maxPos[0],
				  bottom: maxPos[1],
				  height: 0,
				  width: 0,
				  length:0,
				  x: 0,
				  y: 0,
				  z: 0,
				  rotation_y: 0});
	    }
	    return annotations;
	} else {
	    // TODO
	}
    }

    // Send annotations to server if (isModified())
    isModified() {
	return this.bboxes.toString() != this.originalBboxes.toString();
    }
    // <---

    // Call this first to specify target label
    setLabelId(labelId) {
	this.labelId = labelId;
    }

    // Get informations of workspace (call this for initialization)
    getWorkFiles() {
	this.workBlob = "input"; // "https://devrosbag.blob.core.windows.net/labeltool/3d_label_test";
	this.curFile = 1; // For test (please make labeling tool start with frame:1
		/* var rawFile = new XMLHttpRequest();
	   rawFile.open("GET", "https://devrosbag.blob.core.windows.net/labeltool/3d_label_test/ImageSets/Main/trainval.txt", false);
	   rawFile.onreadystatechange = function (){
	   if(rawFile.readyState === 4){
	   if(rawFile.status === 200 || rawFile.status == 0){
	   var allText = rawFile.responseText;
	   this.fileList = allText.split("\n")
	   }
	   }
	   }*/
	this.fileList = ["000000", "000001"]
	this.results = new Array(this.fileList.length);
	/* rawFile.send(null);*/
	this.originalSize[0] = 800;
	this.originalSize[1] = 600;
	if (this.dataType == "JPEG") {
	    dirBox.value = this.workBlob;
	} else {
	    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
	    init();
	    animate();
	}
	this.showData();
    }

    // Create workspace on server
    setWorkFiles() {
	this.getWorkFiles();
    }

    // Get annotations from server
    getAnnotations() {
	var res = [];
	var fileName = this.fileList[this.curFile] + ".txt";
	var rawFile = new XMLHttpRequest();
	rawFile.open("GET", this.workBlob + '/Annotations/' + fileName, false);
	rawFile.onreadystatechange = function (){
	    if(rawFile.readyState === 4){
		if(rawFile.status === 200 || rawFile.status == 0) {
		    var allText = rawFile.responseText;
		    var str_list = allText.split("\n");
		    for (var i = 0 ; i < str_list.length ; i++) {
			var str = str_list[i].split(",");
			if(str.length == 15){
			    res.push({label: str[0],
				      truncated: str[1],
				      occluded: str[2],
				      alpha: str[3],
				      left: str[4],
				      top: str[5],
				      right: str[6],
				      bottom: str[7],
				      height: str[8],
				      width: str[9],
				      length:str[10],
				      x: str[11],
				      y: str[12],
				      z: str[13],
				      rotation_y: str[14]});
			}
		    }
		}
	    }
	}
	rawFile.send(null);
	this.loadAnnotations(res);
    }

    // Output annotations
    setAnnotations() {
	this.pending = true;
	if (this.dataType == "JPEG") {
	    textBox.value = "Sending... plz do nothing.";
	}
	var annotations = this.packAnnotations();
	this.results[this.curFile] = annotations;
    }

    previousFile() {
	if (this.curFile > 0) {
	    if (this.isModified()) {
		this.setAnnotations();
	    }
	    this.curFile--;
	    this.onChangeFile();
	}
    }

    nextFile() {
	if (this.curFile < this.fileList.length-1) {
	    if (this.isModified()) {
		this.setAnnotations();
	    }
	    this.curFile++;
	    this.onChangeFile();
	}
    }

    jumpFile() {
	if (this.curFile < this.fileList.length-1) {
	    if (this.isModified()) {
		this.setAnnotations();
	    }
	    this.curFile = Number(pageBox.value) - 1;
	    this.onChangeFile();
	}
    }

    onChangeFile() {
	if (this.dataType == "JPEG") {
	    imageBox.value = (this.curFile+1) + "/" + this.fileList.length; //TODO
	}
	ground_mesh.visible = false;
    image_array[0].visible = false;

    for (var k = 0 ; k < parameters.i + 1 ; k++){
	    gui.removeFolder('BoundingBox'+String(k));
	    cube_array[k].visible=false;
	}
    this.originalBboxes = [];
    this.bboxes = [];
	cube_array = [];
    numbertag_list = [];
    parameters.i = -1;
    bb1 = [];
    numbertag_list = [];
    folder_position = [];
    folder_size = [];
  	this.showData();
    }

    // Archive and update database
    archiveWorkFiles() {
    	alert("upload database")
    }
}
