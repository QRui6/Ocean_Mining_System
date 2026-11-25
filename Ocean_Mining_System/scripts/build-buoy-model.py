"""Build the flux buoy display model in metres. Local coordinates are glTF Y-up."""
import json
import math
import struct
from pathlib import Path

import numpy as np

materials = [
    ("海洋黄", (.96,.56,.023), .32), ("铝合金", (.62,.72,.76), .65),
    ("光伏电池", (.018,.075,.19), .28), ("缆绳", (.045,.075,.09), .12),
    ("传感器外壳", (.86,.92,.92), .22), ("航标灯", (.95,.15,.025), .15),
]
meshes, nodes, views, accessors = [], [], [], []
binary = bytearray()
mesh_ids = {}


def accessor(data, kind, component, bounds=False):
    a = np.asarray(data, dtype="<f4" if component == 5126 else "<u2")
    view = len(views)
    views.append(dict(buffer=0, byteOffset=len(binary), byteLength=a.nbytes))
    binary.extend(a.tobytes())
    binary.extend(b"\0" * (-len(binary) % 4))
    entry = dict(bufferView=view, componentType=component, count=len(a), type=kind)
    if bounds:
        entry.update(min=a.min(axis=0).tolist(), max=a.max(axis=0).tolist())
    accessors.append(entry)
    return len(accessors)-1


def geometry(kind):
    triangles = []
    if kind == "box":
        for axis in range(3):
            for sign in (-1, 1):
                face = []
                for u,v in ((-1,-1),(1,-1),(1,1),(-1,1)):
                    p = [0.0]*3
                    p[axis], p[(axis+1)%3], p[(axis+2)%3] = sign/2,u/2,v/2
                    face.append(p)
                if sign < 0:
                    face.reverse()
                triangles.extend([[face[0], face[1], face[2]], [face[0], face[2], face[3]]])
    else:
        for i in range(32):
            a,b = i*math.tau/32,(i+1)*math.tau/32
            def rim(angle, y):
                return [math.cos(angle), y, math.sin(angle)]
            p,q,r,s = rim(a,-.5),rim(a,.5),rim(b,.5),rim(b,-.5)
            triangles.extend([[p,q,r],[p,r,s],[[0,.5,0],r,q],[[0,-.5,0],p,s]])
    vertices = np.asarray(triangles)
    normals = np.cross(vertices[:,1]-vertices[:,0],vertices[:,2]-vertices[:,0])
    normals /= np.linalg.norm(normals,axis=1)[:,None]
    return {"POSITION":accessor(vertices.reshape(-1,3),"VEC3",5126,True),
            "NORMAL":accessor(np.repeat(normals,3,axis=0),"VEC3",5126)}


shapes = {kind: geometry(kind) for kind in ("box","cylinder")}


def part(name, kind, center, size, material=0, rotation=None):
    key = (kind, material)
    if key not in mesh_ids:
        mesh_ids[key] = len(meshes)
        meshes.append({"primitives":[{"attributes":shapes[kind],"material":material}]})
    node = dict(name=name, mesh=mesh_ids[key], translation=list(center), scale=list(size))
    if rotation is not None:
        node["rotation"] = list(rotation)
    nodes.append(node)


def rod(name, start, end, radius, material=0):
    p,q = np.array(start),np.array(end)
    direction = (q-p)/np.linalg.norm(q-p)
    quat = np.r_[np.cross([0,1,0],direction), 1+direction[1]]
    quat = quat/np.linalg.norm(quat) if np.linalg.norm(quat)>1e-8 else [1,0,0,0]
    part(name,"cylinder",(p+q)/2,(radius,np.linalg.norm(q-p),radius),material,quat)


base = []
for index in range(4):
    angle = math.pi/4+index*math.pi/2
    x,z = 1.05*math.cos(angle),1.05*math.sin(angle)
    base.append((x,.49,z))
    part("浮筒","cylinder",(x,0,z),(.46,1.1,.46))
    part("浮筒护圈","cylinder",(x,.48,z),(.475,.08,.475))
    rod("承力支架",(x,.49,z),(x*.17,1.85,z*.17),.045)
    rod("水下支架",(x,-.45,z),(0,-1.4,0),.045)
for a,b in zip(base,base[1:]+base[:1]):
    rod("浮体框架",a,b,.07)
rod("主桅杆",(0,.45,0),(0,5.95,0),.092)
rod("避雷针",(0,5.95,0),(0,6.55,0),.018,1)
for height in (2,3,5):
    z = .18 if height==3 else -.1
    rod("传感器横臂",(0,height-.18,0),(1.12,height-.18,z),.034)
    rod("横臂支撑",(.05,height-.55,0),(.74,height-.18,z),.022)
    rod(f"wind-{height}m",(.96,height-.18,z),(.96,height+.16,z),.029,1)
    part(f"wind-{height}m","cylinder",(.96,height+.16,z),(.085,.09,.085),4)
    for i in range(3):
        a = math.tau*i/3
        dx,dz = .2*math.cos(a),.2*math.sin(a)
        rod(f"wind-{height}m",(.96,height+.16,z),(.96+dx,height+.16,z+dz),.012,4)
        part(f"wind-{height}m","cylinder",(.96+dx,height+.16,z+dz),(.053,.075,.053),4)
    rod("温湿度支架",(0,height,0),(-.66,height,0),.028)
    for j in range(5):
        part("温湿度防辐射罩","cylinder",(-.66,height+.035*j,0),(.085,.022,.085),4)
part("航标灯","cylinder",(0,5.95,0),(.105,.15,.105),5)
for sign in (-1,1):
    angle = sign*math.radians(24)
    rotation = [math.sin(angle/2),0,0,math.cos(angle/2)]
    center = np.array([0,.99,sign*.71])
    def panel_point(x,y,z):
        return center + [x,y*math.cos(angle)-z*math.sin(angle),y*math.sin(angle)+z*math.cos(angle)]
    part("太阳能边框","box",center,(1.13,.065,.74),1,rotation)
    for x in range(5):
        for z in range(3):
            part("太阳能电池片","box",panel_point((x-2)*.213,.039,(z-1)*.223),(.203,.01,.212),2,rotation)
part("电池及采集舱","cylinder",(0,-.31,0),(.28,1.5,.28),1)
rod("CTD",(0,-.95,0),(0,-1.65,0),.11,3)
part("转环","cylinder",(0,-1.7,0),(.09,.14,.09),1)

document = dict(asset={"version":"2.0","generator":"Ocean Mining System"},scene=0,
    scenes=[{"nodes":list(range(len(nodes)))}],nodes=nodes,meshes=meshes,
    materials=[dict(name=name,pbrMetallicRoughness=dict(baseColorFactor=[*color,1],metallicFactor=metal,roughnessFactor=.52)) for name,color,metal in materials],
    buffers=[dict(byteLength=len(binary))],bufferViews=views,accessors=accessors)
metadata=json.dumps(document,ensure_ascii=False,separators=(",",":")).encode()
metadata+=b" "*(-len(metadata)%4)
out=Path(__file__).resolve().parents[1]/"public/models/deepsea-flux-buoy.glb"
out.parent.mkdir(exist_ok=True)
out.write_bytes(struct.pack("<4sII",b"glTF",2,28+len(metadata)+len(binary))+struct.pack("<I4s",len(metadata),b"JSON")+metadata+struct.pack("<I4s",len(binary),b"BIN\0")+binary)

# Bake the shared display mesh for both camera views. The sea is Y=0:
# above-water metres keep their scale; 1,000 underwater metres occupy one metre.
# Baking each triangle also handles pieces which cross the waterline.
schematic_nodes, schematic_meshes = [], []
for node in nodes:
    primitive = meshes[node["mesh"]]["primitives"][0]
    position_accessor = accessors[primitive["attributes"]["POSITION"]]
    position_view = views[position_accessor["bufferView"]]
    positions = np.frombuffer(binary, dtype="<f4", count=position_accessor["count"]*3,
                              offset=position_view["byteOffset"]).copy().reshape(-1,3)
    x,y,z,w = node.get("rotation", [0,0,0,1])
    rotation = np.array([
        [1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
        [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)],
        [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]
    ])
    positions = (positions*np.array(node["scale"])) @ rotation.T + np.array(node["translation"])
    positions[:,1] = np.where(positions[:,1]<0, positions[:,1]/1000, positions[:,1])
    triangles = positions.reshape(-1,3,3)
    normals = np.cross(triangles[:,1]-triangles[:,0], triangles[:,2]-triangles[:,0])
    normals /= np.maximum(np.linalg.norm(normals,axis=1)[:,None], 1e-12)
    attributes = {
        "POSITION": accessor(positions,"VEC3",5126,True),
        "NORMAL": accessor(np.repeat(normals,3,axis=0),"VEC3",5126)
    }
    schematic_nodes.append({"name":node["name"],"mesh":len(schematic_meshes)})
    schematic_meshes.append({"primitives":[{"attributes":attributes,"material":primitive["material"]}]})
schematic = {**document, "nodes":schematic_nodes, "meshes":schematic_meshes,
             "scenes":[{"nodes":list(range(len(schematic_nodes)))}],
             "buffers":[{"byteLength":len(binary)}]}
metadata = json.dumps(schematic,ensure_ascii=False,separators=(",",":")).encode()
metadata += b" "*(-len(metadata)%4)
out.with_name("deepsea-flux-buoy-schematic.glb").write_bytes(
    struct.pack("<4sII",b"glTF",2,28+len(metadata)+len(binary))+
    struct.pack("<I4s",len(metadata),b"JSON")+metadata+
    struct.pack("<I4s",len(binary),b"BIN\0")+binary)
