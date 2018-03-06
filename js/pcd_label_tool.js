/* var canvas2D,stats,image_2d,ctx;*/
var camera, controls, scene, renderer;
var cube;
var keyboard = new KeyboardState();
var numbertag_list = [];
var gui_tag = [];
var gui = new dat.GUI();
var bb1 = [];
var folder_position = [];
var folder_size = [];
var bbox_flag = true;
var click_flag = false;
var click_object_index = 0;
var mouse_down = { x: 0, y: 0 };
var mouse_up = { x: 0, y: 0 };
var click_point = THREE.Vector3();
var click_plane_array = []
var attribute = ["car", "pedestrian", "motorbike", "bus", "truck", "cyclist", "train", "obstacle", "stop_signal", "wait_signal", "gosignal"];
var input_filename = 'input'
var now_flame = 0
var ground_mesh
var image_array = []
var bird_view_flag = false;
var cls = 0;

var parameters = {
    i : -1,
    flame : now_flame,
    image_checkbox : true,
    addbboxpara : function() {
	var init_parameters = {
	    x : 1,
	    y : 0,
	    z : -1,
	    delta_x : 0,
	    delta_y : 0,
	    delta_z : 0,
	    width : 0.5,
	    height : 0.5,
	    depth : 0.5,
	    yaw : 0,
        org:original = {
            x : 1,
            y : 0,
            z : -1,
            delta_x : 0,
            delta_y : 0,
            delta_z : 0,
            width : 0.5,
            height : 0.5,
            depth : 0.5,
            yaw : 0,
            }
	};
    if(bboxes.exists(bboxes.getTargetIndex(), "PCD")==true){
    bboxes.selectEmpty();}
    bboxes.setTarget("PCD",init_parameters);
	//addbbox(parameters.i,init_parameters);
	//gui_reset_tag();
    },
    next : function() {
	labelTool.nextFile();
    },
    before : function() {
	labelTool.previousFile();
    },
    hold_bbox_flag : false,
    bird_view : function() {
	bird_view();
    },
    camera_view : function() {
	camera_view();
    },
    update_database : function() {
	labelTool.archiveWorkFiles();
    }
    //,result: function() {result(1,cube_array);}
}

labelTool.onInitialize("PCD", function() {
    if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
    init();
    animate();
});

// Visualize 2d and 3d data
labelTool.onLoadData("PCD", function() {
    parameters.flame = labelTool.curFile;
    var img_url = labelTool.workBlob + '/JPEGImages/'
		+ labelTool.fileNames[labelTool.curFile] + '.jpg';
    var textloader = new THREE.TextureLoader()
    textloader.crossOrigin = '';
    var image = textloader.load(img_url);
    image.minFilter = THREE.LinearFilter;
    var material = new THREE.MeshBasicMaterial({map: image});
    var geometry = new THREE.PlaneGeometry(4, 3);
    var image_plane = new THREE.Mesh(geometry, material);
    var pcd_loader = new THREE.PCDLoader();
    var pcd_url = labelTool.workBlob + '/PCDPoints/'
		+ labelTool.fileNames[labelTool.curFile] + '/all.pcd';
    //var oldFile = labelTool.curFile;
    //var that = this;
    pcd_loader.load(pcd_url, function (mesh) {
	//if (oldFile == that.curFile) {
	    scene.add(mesh);
	    ground_mesh = mesh;
        labelTool.hasPCD = true;
	    /* var center = mesh.geometry.boundingSphere.center;*/
	//}
    });
    //var image_mat = MaxProd(CameraExMat, [0, 0, 2, 1]);
    var image_mat = [3.0, 0, -1, 1];
    image_plane.position.x = image_mat[0];
    image_plane.position.y = image_mat[1];
    image_plane.position.z = image_mat[2];
    image_plane.rotation.y = -Math.PI/2;
    image_plane.rotation.x = Math.PI/2;
    scene.add(image_plane);
    image_array = [];
    image_array.push(image_plane);
    /* image_2d = new Image();
     * image_2d.crossOrigin = 'Anonymous'
     * image_2d.src = this.workBlob + '/JPEGImages/'
       + this.fileList[this.curFile] + '.jpg?' + new Date().getTime();
     * image_2d.onload = function() {
       ctx.drawImage(image_2d, 0, 0);
     * }*/
    if(parameters.image_checkbox==false){
	image_array[0].visible = false;
    }
    if(bird_view_flag==true){
    image_array[0].visible = false;
    }
});

bboxes.onSelect(function(newIndex, oldIndex) {
    click_plane_array = [];
    for (var i = 0; i < bboxFolders.length; i++){
	if (bboxFolders[i] != undefined) {
	    bboxFolders[i].close();
	}
    }
    if (bboxFolders[newIndex] != undefined) {
	bboxFolders[newIndex].open();
    }
    if (folder_position[newIndex] != undefined) {
	folder_position[newIndex].open();
    }
    if (folder_size[newIndex] != undefined) {
	folder_size[newIndex].open();
    }
});

//add remove function in dat.GUI
dat.GUI.prototype.removeFolder = function(name){
    var folder = this.__folders[name];
    if (!folder) {
	return;
    }

    folder.close();
    this.__ul.removeChild(folder.domElement.parentNode);
    delete this.__folders[name];
    this.onResize();
}


/* if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
 * init();
 * animate();*/


//read local calibration file.
function readYAMLFile(filename) {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", filename, false);
    rawFile.onreadystatechange = function (){
	if(rawFile.readyState === 4){
	    if(rawFile.status === 200 || rawFile.status == 0){
		var allText = rawFile.responseText;
		for (var i = 0 ; i < allText.split("\n").length ; i++){
		    if(allText.split("\n")[i].split(":")[0].trim() == 'data'){
			labelTool.CameraExMat = [[parseFloat(allText.split("\n")[i].split(":")[1].split("[")[1].split(",")[0]),parseFloat(allText.split("\n")[i].split(":")[1].split("[")[1].split(",")[1]),parseFloat(allText.split("\n")[i+1].trim().split(",")[0]),parseFloat(allText.split("\n")[i+1].trim().split(",")[1])],
				       [parseFloat(allText.split("\n")[i+2].trim().split(",")[0]),parseFloat(allText.split("\n")[i+2].trim().split(",")[1]),parseFloat(allText.split("\n")[i+3].trim().split(",")[0]),parseFloat(allText.split("\n")[i+3].trim().split(",")[1])],
				       [parseFloat(allText.split("\n")[i+4].trim().split(",")[0]),parseFloat(allText.split("\n")[i+4].trim().split(",")[1]),parseFloat(allText.split("\n")[i+5].trim().split(",")[0]),parseFloat(allText.split("\n")[i+5].trim().split(",")[1])],
				       [0,0,0,1]];
			break
		    }
		}
	    }
	}
    }

    rawFile.send(null);
}

//calicurate inverce matrix
function invMax(inMax){
    var a = new Array(4);
    for(i = 0 ; i < 4 ; i++ ){
	a[i] = new Array(4);
	for(j = 0; j < 4; j++){
            a[i][j] = inMax[i][j];
	}
    }
    var c = a.length;
    var buf;
    var i, j, k;
    var inv = new Array(c);
    for(i = 0 ; i < c ; i++ ){
	inv[i] = new Array(c);
	for(j = 0; j < c; j++){
	    inv[i][j] = (i == j)?1.0:0.0;
	}
    }

    for(i = 0; i < c; i++){
	buf = 1/a[i][i];
	for(j = 0 ; j < c ; j++){
	    a[i][j] *= buf;
	    inv[i][j] *= buf;
	}

	for(j = 0 ; j < c ; j++){
	    if(i != j){
		buf = a[j][i];
		for(k = 0 ; k < c ; k++){
		    a[j][k] -= a[i][k]*buf;
		    inv[j][k] -= inv[i][k]*buf;
		}
	    }
	}
    }

    return inv;
}

//calicurate prod of matrix
function MaxProd (inMax1,inMax2){
    var outMax = [0,0,0,0];
    outMax[0] = inMax1[0][0] * inMax2[0] + inMax1[0][1] * inMax2[1] + inMax1[0][2] * inMax2[2] + inMax1[0][3] * inMax2[3];
    outMax[1] = inMax1[1][0] * inMax2[0] + inMax1[1][1] * inMax2[1] + inMax1[1][2] * inMax2[2] + inMax1[1][3] * inMax2[3];
    outMax[2] = inMax1[2][0] * inMax2[0] + inMax1[2][1] * inMax2[1] + inMax1[2][2] * inMax2[2] + inMax1[2][3] * inMax2[3];
    outMax[3] = inMax1[3][0] * inMax2[0] + inMax1[3][1] * inMax2[1] + inMax1[3][2] * inMax2[2] + inMax1[3][3] * inMax2[3];
    return outMax
}

//load pcd data and image data
function data_load() {
    labelTool.showData;
}

//change camera position to bird view position
function bird_view() {
    camera.position.set(0, 0, 15);
    camera.up.set(1, 0, 0);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    controls.target.set(0, 0, 0);
    bird_view_flag = true;
    parameters.image_checkbox = true;
    image_array[0].visible = false;
    $("#jpeg-label-canvas").show();
    changeCanvasSize($("#canvas3d").width() / 4, $("#canvas3d").width() * 5 / 32);
}

//change camera position to initial position
function camera_view(){
    camera.position.set(0,0,0.5);
    camera.up.set(0, 0, 1);
    camera.lookAt(new THREE.Vector3(1, 0, 0));
    controls.target.set( 1, 0, 0);
    parameters.image_checkbox = true;
    image_array[0].visible = true;
    $("#jpeg-label-canvas").hide();
    bird_view_flag = false;
}

//add new bounding box
bboxes.onAdd("PCD", function(index, cls, read_parameters){
    //labelTool.setPCDBBox(read_parameters);
    //index = 1 + index;
    var num = index;
    var bbox = read_parameters;//labelTool.getPCDBBox(num);
    labelTool.bbox_index.push(index.toString())
    var cubeGeometry = new THREE.CubeGeometry(1.0,1.0,1.0);
    var cubeMaterial = new THREE.MeshBasicMaterial( { color: 0x008866, wireframe:true } );
    cube = new THREE.Mesh( cubeGeometry, cubeMaterial );
    cube.position.set(bbox.x,-bbox.y,bbox.z);
    cube.scale.set(bbox.width, bbox.height , bbox.depth);
    cube.rotation.z = bbox.yaw;
    scene.add(cube);
    labelTool.cube_array.push(cube);
    addbbox_gui(bbox,num);
    return bbox;
});

//register now bounding box
function addbbox_gui(bbox,num){
    var index = bb1.length
    var bb = gui.addFolder('BoundingBox'+String(num));
    bb1.push(bb);
    var folder1 = bb1[index].addFolder('Position');
    var cubeX = folder1.add( bbox, 'x' ).min(-50).max(50).step(0.01).listen();
    var cube_delta_X = folder1.add( bbox, 'delta_x' ).min(-2).max(2).step(0.01).listen();
    var cubeY = folder1.add( bbox, 'y' ).min(-30).max(30).step(0.01).listen();
    var cube_delta_Y = folder1.add( bbox, 'delta_y' ).min(-2).max(2).step(0.01).listen();
    var cubeZ = folder1.add( bbox, 'z' ).min(-3).max(10).step(0.01).listen();
    var cube_delta_Z = folder1.add( bbox, 'delta_z' ).min(-2).max(2).step(0.01).listen();
    var cubeYaw = folder1.add( bbox, 'yaw' ).min(-Math.PI/2).max(0).step(0.05).listen();
    folder1.close();
    folder_position.push(folder1);
    var folder2 = bb1[index].addFolder('Size');
    var cubeW = folder2.add( bbox, 'width' ).min(0).max(10).step(0.01).listen();
    var cubeH = folder2.add( bbox, 'height' ).min(0).max(10).step(0.01).listen();
    var cubeD = folder2.add( bbox, 'depth' ).min(0).max(10).step(0.01).listen();
    folder2.close();
    folder_size.push(folder2);
    cubeX.onChange(function(value){labelTool.cube_array[index].position.x = value;});
    cubeY.onChange(function(value){labelTool.cube_array[index].position.y = -value;});
    cubeZ.onChange(function(value){labelTool.cube_array[index].position.z = value;});
    cube_delta_X.onChange(function(value){labelTool.cube_array[index].position.x = bbox.x + value;});
    cube_delta_Y.onChange(function(value){labelTool.cube_array[index].position.y = -bbox.y - value;});
    cube_delta_Z.onChange(function(value){labelTool.cube_array[index].position.z = bbox.z + value;});
    cubeYaw.onChange(function(value){labelTool.cube_array[index].rotation.z = value;});
    cubeW.onChange(function(value){labelTool.cube_array[index].scale.x = value;});
    cubeH.onChange(function(value){labelTool.cube_array[index].scale.y = value;});
    cubeD.onChange(function(value){labelTool.cube_array[index].scale.z = value;});
    var reset_parameters = {
	reset: function() {
	    resetCube(num,index);
	},
	delete: function (){
	    gui.removeFolder('BoundingBox'+String(num));
	    labelTool.cube_array[index].visible=false;
        bboxes.remove(num,"PCD");
        //bboxes.selectEmpty();
	}
    };

    //numbertag_list.push(num);
    //labeltag = bb1[num].add( bbox, 'label' ,attribute).name("Attribute");
    bb1[bb1.length-1].add(reset_parameters, 'reset' ).name("Reset");
    d = bb1[bb1.length-1].add(reset_parameters, 'delete' ).name("Delete");
}

/*add gui number tag to integrate 2d labeling result
function gui_add_tag(){
    for (var i = 0 ; i < numbertag_list.length ; i++){
	tag = bb1[i].add( labelTool.getPCDBBox(i), 'numbertag' ,numbertag_list).name("BoundingBoxTag");
	gui_tag.push(tag)
    }
}

//update gui number tag to integrate 2d labeling result
function gui_reset_tag(){
    for (var i = 0 ; i < numbertag_list.length-1 ; i++){
	bb1[i].remove(gui_tag[i]);
    }

    gui_tag = [];
    for (var i = 0 ; i < numbertag_list.length ; i++){
	tag = bb1[i].add( labelTool.getPCDBBox(i), 'numbertag' ,numbertag_list).name("BoundingBoxTag");
	gui_tag.push(tag)
    }
}
*/
//reset cube patameter and position
function resetCube(index,num)
{
    var reset_bbox = bboxes.get(index,"PCD");
    reset_bbox.x = reset_bbox.org.x;
    reset_bbox.y = reset_bbox.org.y;
    reset_bbox.z = reset_bbox.org.z;
    reset_bbox.yaw = reset_bbox.org.yaw;
    reset_bbox.width = reset_bbox.org.width;
    reset_bbox.height = reset_bbox.org.height;
    reset_bbox.depth = reset_bbox.org.depth;
    reset_bbox.delta_x = 0;
    reset_bbox.delta_y = 0;
    reset_bbox.delta_z = 0;
    labelTool.cube_array[num].position.x = reset_bbox.x;
    labelTool.cube_array[num].position.y = -reset_bbox.y;
    labelTool.cube_array[num].position.z = reset_bbox.z;
    labelTool.cube_array[num].rotation.z = reset_bbox.yaw;
    labelTool.cube_array[num].scale.x = reset_bbox.width;
    labelTool.cube_array[num].scale.y = reset_bbox.height;
    labelTool.cube_array[num].scale.z = reset_bbox.depth;
}

//change window size
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

//drow animation
function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
    keyboard.update();
    if ( keyboard.down("shift") ){
	controls.enabled = true;
	bbox_flag = false;
    }

    if ( keyboard.up("shift") ){
	controls.enabled = false;
	bbox_flag = true;
    }

    controls.update();
    stats.update();
    for (var i = 0 ; i < labelTool.cube_array.length; i++){
    if(labelTool.bbox_index[i]==bboxes.getTargetIndex()){
        bb1[i].open();
        folder_position[i].open();
        folder_size[i].open();
    }
    else{
        bb1[i].close();
    }
	if(bb1[i].closed==false){
	    labelTool.cube_array[i].material.color.setHex( 0xff0000 );
	    folder_position[i].open();
	    folder_size[i].open();
	}

	if(bb1[i].closed==true){
	    labelTool.cube_array[i].material.color.setHex( 0x008866 );
	}
    }
}

function init() {
    scene = new THREE.Scene();
    var axisHelper = new THREE.AxisHelper( 0.1 );
    axisHelper.position.set(0,0,0);
    scene.add( axisHelper );
    camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 0.01, 10000 );
    camera.position.set(0,0,0.5);
    camera.up.set(0,0,1);
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setClearColor( 0x000000 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    controls = new THREE.OrbitControls( camera,renderer.domElement );
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 0.3;
    controls.panSpeed = 0.2;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.enableDamping = false;
    controls.dampingFactor = 0.3;
    controls.minDistance = 0.3;
    controls.maxDistance = 0.3 * 100;
    controls.noKey = true;
    controls.enabled = false;
    scene.add( camera );
    controls.target.set( 1, 0, 0);
    controls.update();
    var canvas3D = document.getElementById('canvas3d');
    canvas3D.appendChild(renderer.domElement);
    stats = new Stats();
    canvas3D.appendChild( stats.dom );
    window.addEventListener( 'resize', onWindowResize, false )
    window.addEventListener("contextmenu", function(e){e.preventDefault();
                }, false);

    window.onmousedown = function (ev){
	if(bbox_flag==true){
	    if (ev.target == renderer.domElement) {
		var rect = ev.target.getBoundingClientRect();
		mouse_down.x =  ev.clientX - rect.left;
		mouse_down.y =  ev.clientY - rect.top;
		mouse_down.x =  (mouse_down.x / window.innerWidth) * 2 - 1;
		mouse_down.y = -(mouse_down.y / window.innerHeight) * 2 + 1;
		var vector = new THREE.Vector3( mouse_down.x, mouse_down.y ,1);
		vector.unproject( camera );
		var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
		var click_object = ray.intersectObjects( labelTool.cube_array );
		if ( click_object.length > 0 ){
		    click_flag = true;
		    click_object_index = labelTool.cube_array.indexOf(click_object[0].object);
		    click_point = click_object[0].point;
		    click_cube = labelTool.cube_array[click_object_index];
		    var material = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe:false, transparent: true, opacity : 0.0 } );
		    var geometry = new THREE.PlaneGeometry(200, 200);
		    var click_plane = new THREE.Mesh( geometry, material );
		    click_plane.position.x = click_point.x;
		    click_plane.position.y = click_point.y;
		    click_plane.position.z = click_point.z;
		    var normal  = click_object[0].face;
            if(ev.button==0){
		    if([normal.a,normal.b,normal.c].toString() == [6,3,2].toString() || [normal.a,normal.b,normal.c].toString() == [7,6,2].toString() ){
			click_plane.rotation.x = Math.PI / 2;
			click_plane.rotation.y = labelTool.cube_array[click_object_index].rotation.z;
		    }
		    else if([normal.a,normal.b,normal.c].toString() == [6,7,5].toString() || [normal.a,normal.b,normal.c].toString() == [4,6,5].toString() ){
			click_plane.rotation.x = -Math.PI / 2;
			click_plane.rotation.y = -Math.PI / 2 - labelTool.cube_array[click_object_index].rotation.z;
		    }
		    else if([normal.a,normal.b,normal.c].toString() == [0,2,1].toString() || [normal.a,normal.b,normal.c].toString() == [2,3,1].toString() ){
			click_plane.rotation.x = Math.PI / 2;
			click_plane.rotation.y = Math.PI / 2 + labelTool.cube_array[click_object_index].rotation.z;
		    }
		    else if([normal.a,normal.b,normal.c].toString() == [5,0,1].toString() || [normal.a,normal.b,normal.c].toString() == [4,5,1].toString() ){
			click_plane.rotation.x = -Math.PI / 2;
			click_plane.rotation.y = -labelTool.cube_array[click_object_index].rotation.z;
		    }
		    else if([normal.a,normal.b,normal.c].toString() == [3,6,4].toString() || [normal.a,normal.b,normal.c].toString() == [1,3,4].toString() ){
			click_plane.rotation.y = -Math.PI
		    }
		    scene.add( click_plane );
		    click_plane_array.push(click_plane);}
            else if(ev.button==2){
                labelTool.cube_array[click_object_index].visible=false;
                num1 = labelTool.bbox_index[click_object_index];
                gui.removeFolder('BoundingBox'+String(num1));
                bboxes.remove(num1,"PCD");
            }
		}
	    }
	}
    }

    window.onmouseup = function(ev) {
    if(ev.button==0){
	if(bbox_flag==true){
	    var rect = ev.target.getBoundingClientRect();
	    mouse_up.x =  ev.clientX - rect.left;
	    mouse_up.y =  ev.clientY - rect.top;
	    mouse_up.x =  (mouse_up.x / window.innerWidth) * 2 - 1;
	    mouse_up.y = -(mouse_up.y / window.innerHeight) * 2 + 1;
	    var vector = new THREE.Vector3(  mouse_up.x, mouse_up.y ,1);
	    vector.unproject( camera );
	    var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
	    var click_object = ray.intersectObjects(click_plane_array);
	    if ( click_object.length > 0 && bb1[click_object_index].closed==false){
        var click_box = bboxes.get(labelTool.bbox_index[click_object_index],"PCD");
		var drag_vector = {x:click_object[0].point.x - click_point.x, y:click_object[0].point.y - click_point.y, z:click_object[0].point.z - click_point.z};
		var yaw_drag_vector = {x:drag_vector.x * Math.cos(-labelTool.cube_array[click_object_index].rotation.z) - drag_vector.y * Math.sin(-labelTool.cube_array[click_object_index].rotation.z), y:drag_vector.x * Math.sin(-labelTool.cube_array[click_object_index].rotation.z) + drag_vector.y * Math.cos(-labelTool.cube_array[click_object_index].rotation.z), z:drag_vector.z};
		var judge_click_point = {x:(click_point.x - labelTool.cube_array[click_object_index].position.x) * Math.cos(-labelTool.cube_array[click_object_index].rotation.z) - (click_point.y - labelTool.cube_array[click_object_index].position.y) * Math.sin(-labelTool.cube_array[click_object_index].rotation.z), y:(click_point.x - labelTool.cube_array[click_object_index].position.x) * Math.sin(-labelTool.cube_array[click_object_index].rotation.z) + (click_point.y - labelTool.cube_array[click_object_index].position.y) * Math.cos(-labelTool.cube_array[click_object_index].rotation.z)};
		click_box.width = judge_click_point.x*yaw_drag_vector.x/Math.abs(judge_click_point.x) + click_box.width;
		click_box.x = drag_vector.x/2 + click_box.x;
		click_box.height = judge_click_point.y*yaw_drag_vector.y/Math.abs(judge_click_point.y) + click_box.height;
		click_box.y = -drag_vector.y/2 + click_box.y;
		click_box.depth = (click_point.z - labelTool.cube_array[click_object_index].position.z)*drag_vector.z/Math.abs((click_point.z - labelTool.cube_array[click_object_index].position.z)) + click_box.depth;
		click_box.z = drag_vector.z/2 + click_box.z;
		labelTool.cube_array[click_object_index].position.x = click_box.x;
		labelTool.cube_array[click_object_index].position.y = -click_box.y;
		labelTool.cube_array[click_object_index].position.z = click_box.z;
		labelTool.cube_array[click_object_index].rotation.z = click_box.yaw;
		labelTool.cube_array[click_object_index].scale.x = click_box.width;
		labelTool.cube_array[click_object_index].scale.y = click_box.height;
		labelTool.cube_array[click_object_index].scale.z = click_box.depth;
	    }
	    if(click_flag==true){
		click_plane_array = [];
        bboxes.select(labelTool.bbox_index[click_object_index],"PCD")
        click_flag = false;
		//for(var i = 0 ; i < bb1.length; i++){
		//    bb1[i].close();
		//}
		//bb1[click_object_index].open();
		//folder_position[click_object_index].open();
		//folder_size[click_object_index].open();
        //
	    }
	}}
    }

    gui.add(parameters, 'addbboxpara').name("AddBoundingBox");
    //gui.add(parameters, 'flame').name("Nowflame").listen();
    //gui.add(parameters, 'next').name("NextData");
    //gui.add(parameters, 'before').name("BeforeData");
    //var HoldCheck = gui.add(parameters, 'hold_bbox_flag').name("Hold").listen();
    //gui.add(parameters, 'update_database').name("UploadDatabase");
    gui.add(parameters, 'bird_view').name("BirdView");
    gui.add(parameters, 'camera_view').name("CameraView");
    var ImageCheck = gui.add(parameters, 'image_checkbox').name("Image").listen();
    //gui.add(parameters,'result').name("result");

    readYAMLFile(labelTool.workBlob + "/calibration.yml");
    data_load(parameters);
    gui.open();
    //HoldCheck.onChange(function(value){labelTool.hold_flag = value;})
    ImageCheck.onChange(function(value) {
	if (!bird_view_flag) {
	    image_array[0].visible = value;
	} else if (bird_view_flag && value) {
	    $("#jpeg-label-canvas").show();
	} else if (bird_view_flag && !value) {
	    $("#jpeg-label-canvas").hide();
	}
    });
        //result(0, cube_array, labelTool.bboxes)

    /* canvas2D = document.getElementById('canvas2d');
     * ctx = canvas2D.getContext('2d');*/
    /* ctx.scale(0.3,0.3);
     * image_2d = new Image();
     * image_2d.crossOrigin = 'Anonymous';
     * image_2d.src = labelTool.workBlob + '/JPEGImages/' + ( '000000'  + parameters.flame ).slice( -6 )  + '.jpg?' + new Date().getTime();
     * image_2d.onload = function() {
       ctx.drawImage(image_2d, 0, 0, 800, 600);
     * }
     * canvas2D.style.display = "none";*/
}
