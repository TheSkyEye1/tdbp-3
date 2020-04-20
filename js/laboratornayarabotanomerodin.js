
var container;
var camera, scene, renderer;
var imagedata;
var geometry;
var spotlight = new THREE.PointLight(0xffffff);
var keyboard = new THREEx.KeyboardState();
var N = 256;
var clock = new THREE.Clock();
var mixer, morphs1 = [];
var morphs = [];
var birdpath, birdpath1;
var count;
var curveObject, curveObject1;
var helper;
init();
animate();

function init()
{
    
    container = document.getElementById( 'container' );
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.set(N/2,N,N/2);
    camera.lookAt(new THREE.Vector3( N/2, 0.0,N/2));

    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x000000ff, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize, false );
   

    var spotLight = new THREE.SpotLight( 0xffe9ce );
    spotLight.position.set( N*1.5, N*1.5, N/2 );

    spotLight.castShadow = true;

    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;

    spotLight.shadow.camera.near = 100;
    spotLight.shadow.camera.far = 1000;
    spotLight.shadow.camera.fov = 60;

    scene.add( spotLight );
    helper = new THREE.CameraHelper(spotLight.shadow.camera);
    scene.add( helper );
    

    mixer = new THREE.AnimationMixer( scene );

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var img = new Image();
    img.src = 'pics/plateau.jpg';
    img.onload = function()
    {    
        canvas.width = img.width;    
        canvas.height = img.height;    
        context.drawImage(img, 0, 0 );    
        imagedata = context.getImageData(0, 0, img.width, img.height);
        terrain();
    }
    skysphere();
    count = 0;
    img.src = 'pics/plateau.jpg';
    loadModel('models/', "Tree.obj", "Tree.mtl");
    loadAnimatedModel('models/Parrot.glb');
    loadAnimatedModel('models/Stork.glb');
    birdpath = addline();
    birdpath1 = addline1();
}

function terrain()
{
    geometry = new THREE.Geometry();
   
    for (var i=0; i < N; i++)
        for (var j=0; j < N; j++)
        {
        var y = getPixel( imagedata, i, j );
        geometry.vertices.push(new THREE.Vector3( i, y/10.0, j));
    }
 
 
    var c = 0;
 
    for (var i=0; i < N-1; i++)
        for (var j=0; j < N-1; j++)
        {
            var ind0 = i + j*N;
            var ind1 = (i+1) + j*N;
            var ind2 = (i+1) + (j+1)*N;
 
            geometry.faces.push(new THREE.Face3( ind0, ind1, ind2));
            var ind3 = i + j*N;
            var ind4 = (i+1) + (j+1)*N;
            var ind5 = i + (j+1)*N;
 
            geometry.faces.push(new THREE.Face3( ind3, ind4, ind5));

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(i/(N-1), j/(N-1)),      
                new THREE.Vector2((i+1)/(N-1), j/(N-1)),      
                new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1))]);

            geometry.faceVertexUvs[0].push([
                new THREE.Vector2(i/(N-1), j/(N-1)),      
                new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1)),      
                new THREE.Vector2(i/(N-1), (j+1)/(N-1))]);
 
        }
        geometry.computeFaceNormals();  
        geometry.computeVertexNormals();
        var loader = new THREE.TextureLoader();
        var tex = loader.load( 'pics/grasstile.jpg' );
        var mat = new THREE.MeshLambertMaterial({  
        map: tex,    
        wireframe: false,    
        side: THREE.DoubleSide});

    var triangleMesh = new THREE.Mesh(geometry, mat);
    triangleMesh.position.set(0,0,0);
    triangleMesh.receiveShadow = true;
    scene.add(triangleMesh);
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
 
function rotateAroundWorldAxis(object, axis, radians) 
{
    rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);                
    object.matrix.multiply(rotObjectMatrix);
    object.rotation.setFromRotationMatrix(object.matrix);
}

var T = 10;
var T1 = 15;
var t = 0.0;
var t1 = 0.0;
var parrot = false;
var bird = false;
function animate()
{
    var delta = clock.getDelta();
    mixer.update( delta );
    t += delta;
    t1 += delta;
    for ( var i = 0; i < morphs1.length; i ++ )
    {

        morph = morphs1[ i ];
        var pos = new THREE.Vector3();
        if(t1>=T1)
        {
            t1 = 0.0;
        }
        pos.copy(birdpath1.getPointAt(t1/T1));
        morph.position.copy(pos)
        if((t1+0.001) >= T1)
        {
            t1 = 0.0;
        }
        var nextPoint = new THREE.Vector3();
        nextPoint.copy(birdpath1.getPointAt((t1+0.001)/T1));
        morph.lookAt(nextPoint);
        if(bird == true)
        {
            var relativeCameraOffset = new THREE.Vector3(0,15,-25);
            var m1 = new THREE.Matrix4();
            var m2 = new THREE.Matrix4();
            m1.extractRotation(morph.matrixWorld);
            m2.extractPosition(morph.matrixWorld);
            m1.multiplyMatrices(m2, m1);
            var cameraOffset = relativeCameraOffset.applyMatrix4(m1);
            camera.position.copy(cameraOffset);
            camera.lookAt(morph.position );
        }
    }
    for ( var i = 0; i < morphs.length; i ++ )
    {

        morph = morphs[ i ];
        var pos = new THREE.Vector3();
        if(t>=T)
        {
            t = 0.0;
        }
        pos.copy(birdpath.getPointAt(t/T));
        morph.position.copy(pos)
        if((t+0.001) >= T)
        {
            t = 0.0;
        }
        var nextPoint = new THREE.Vector3();
        nextPoint.copy(birdpath.getPointAt((t+0.001)/T));
        morph.lookAt(nextPoint);
        if(parrot == true)
        {
            var relativeCameraOffset = new THREE.Vector3(0,15,-25);
            var m1 = new THREE.Matrix4();
            var m2 = new THREE.Matrix4();
            m1.extractRotation(morph.matrixWorld);
            m2.extractPosition(morph.matrixWorld);
            m1.multiplyMatrices(m2, m1);
            var cameraOffset = relativeCameraOffset.applyMatrix4(m1);
            camera.position.copy(cameraOffset);
            camera.lookAt(morph.position );
        }
    }
    buttonclick();
    requestAnimationFrame( animate );
    render();
}
function render()
{
    renderer.render( scene, camera );
}


 
function getPixel( imagedata, x, y )  
{    
    var position = ( x + imagedata.width * y ) * 4, data = imagedata.data;    
    return data[ position ];;
}

function loadModel(path, oname, mname)
{
    var onProgress = function ( xhr ) 
    {
        if ( xhr.lengthComputable ) {
        var percentComplete = xhr.loaded / xhr.total * 100;
        console.log( Math.round(percentComplete, 2) + '% downloaded' );
        }
    };
    var onError = function ( xhr ) { };
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath( path );
    mtlLoader.load( mname, function( materials )
    {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials( materials );
        objLoader.setPath( path );
        objLoader.load( oname, function ( object )
        {
            object.castShadow = true;
            object.traverse( function ( child )
            {
                if ( child instanceof THREE.Mesh )
                {
                child.castShadow = true;
                }
            } 
            );

            for(var i = 0;i<50;i++)
            {
                var posx = getRandomInt();
                var posz = getRandomInt();
                var posy = geometry.vertices[Math.round(posx)+Math.round(posz)*N].y;
                object.position.x = posx;
                object.position.z = posz;
                object.position.y = posy;
                object.scale.set(0.2,0.2,0.2);
                
                scene.add(object.clone());
            }
        }, 
        onProgress, onError );
    });
}

function getRandomInt() 
{
    return Math.floor(Math.random() * Math.floor(256));
}

function loadAnimatedModel(path)
{
    var loader = new THREE.GLTFLoader();

    loader.load( path, function ( gltf ) 
    {
        var mesh = gltf.scene.children[ 0 ];
        var clip = gltf.animations[ 0 ];
        mixer.clipAction( clip, mesh ).setDuration( 1 ).startAt( 0 ).play();
        mesh.position.set( 20, 40, 20 );
        mesh.rotation.y = Math.PI / 8;
        mesh.scale.set( 0.2, 0.2, 0.2 );
        mesh.castShadow = true;

        scene.add( mesh );
        
            
        if(count == 0)
        {
            morphs.push( mesh );
        }
        else
        {
            morphs1.push(mesh);
        }
        count+=1;
    });
}

function addline()
{
    var curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 128, 50, 80 ), //P0
        new THREE.Vector3( 64, 50, 96 ), //P1
        new THREE.Vector3( 64, 50, 160 ), //P2
        new THREE.Vector3( 128, 50, 180 ) //P3
       );
    var curve1 = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 128, 50, 180 ), //P0
        new THREE.Vector3( 196, 50, 196 ), //P1
        new THREE.Vector3( 196, 50, 64 ), //P2
        new THREE.Vector3( 128, 50, 80 ) //P3
       );  
    var vertices = [];
    vertices = curve.getPoints( 100 ); 
    vertices = vertices.concat(curve1.getPoints( 100 ));

    var path = new THREE.CatmullRomCurve3(vertices);
    path.closed = true;
    var point = path.getPoints(500);
    var geometry = new THREE.Geometry();
    geometry.vertices = vertices;
    var material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
    curveObject = new THREE.Line( geometry, material );
    scene.add(curveObject);
    return path;
}

function addline1()
{
    var curve = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 65,60,65 ), //P0
        new THREE.Vector3( 0,60,128 ), //P1
        new THREE.Vector3( 40,60,255 ), //P2
        new THREE.Vector3( 160,60,160 ) //P3
       );
    var curve1 = new THREE.CubicBezierCurve3(
        new THREE.Vector3( 160,60,160 ), //P0
        new THREE.Vector3( 255,60,60 ), //P1
        new THREE.Vector3( 128,60,0 ), //P2
        new THREE.Vector3( 65,60,65 ) //P3
       );  
    var vertices = [];
    vertices = curve.getPoints( 100 ); 
    vertices = vertices.concat(curve1.getPoints( 100 ));

    var path = new THREE.CatmullRomCurve3(vertices);
    path.closed = true;
    var point = path.getPoints(500);
    var geometry = new THREE.Geometry();
    geometry.vertices = vertices;
    var material = new THREE.LineBasicMaterial( { color : 0xffff00 } );
    curveObject1 = new THREE.Line( geometry, material );
    scene.add(curveObject1);
    return path;
}

function buttonclick()
{
    if (keyboard.pressed("1")) 
    {
        camera.position.set(N/2, N, N/2);
        camera.lookAt(N/2, 0, N/2);
        parrot = false;
        bird = false;
    }
    if(keyboard.pressed("2"))
    {
        parrot = true;
        bird = false;
    }
    if(keyboard.pressed("3"))
    {
        parrot = false;
        bird = true;
    }
    if(keyboard.pressed("4"))
    {
        scene.remove(curveObject);
        scene.remove(curveObject1);
        scene.remove(helper);
    }
    if(keyboard.pressed("5"))
    {
        scene.add(curveObject);
        scene.add(curveObject1);
        scene.add(helper);
    }
}

function skysphere()
{
    
    var loader = new THREE.TextureLoader();
    var geometry = new THREE.SphereGeometry( N*1.5, 32, 32 );
    var tex = loader.load("pics/sky.jpg");

    tex.minFilter = THREE.NearestFilter;
    var material = new THREE.MeshBasicMaterial
    ({
        map: tex,
        side: THREE.DoubleSide
    });

    var sphere = new THREE.Mesh( geometry, material );
    sphere.position.set(N/2, 0, N/2);
    scene.add( sphere );
}







