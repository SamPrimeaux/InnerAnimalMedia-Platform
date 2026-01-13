#!/usr/bin/env python3
"""
Blender Script: Export Scene to GLB
Usage: blender --background --python scripts/blender-export-glb.py -- input.blend output.glb
"""

import sys
import os
import bpy
import argparse

def export_to_glb(input_file, output_file):
    """Export Blender scene to GLB format"""
    try:
        # Clear existing mesh
        bpy.ops.wm.read_factory_settings(use_empty=True)
        
        # Load the blend file
        bpy.ops.wm.open_mainfile(filepath=input_file)
        
        # Select all objects
        bpy.ops.object.select_all(action='SELECT')
        
        # Export to GLB
        bpy.ops.export_scene.gltf(
            filepath=output_file,
            export_format='GLB',
            export_draco_mesh_compression_enable=True,
            export_draco_mesh_compression_level=6,
            export_draco_position_quantization=14,
            export_draco_normal_quantization=10,
            export_draco_texcoord_quantization=12,
            export_tangents=False,
            export_materials='EXPORT',
            export_colors=True,
            export_cameras=False,
            export_lights=False,
            export_yup=True,
            export_animations=True,
            export_force_sampling=False,
            export_frame_step=1,
            export_move_keyframes=False,
            export_def_bones=True,
            export_hierarchy_flatten=False,
            export_leaf_bones=False,
            export_morph=True,
            export_morph_normal=True,
            export_morph_tangent=False,
            export_lights=False,
            export_extras=False,
            export_keep_originals=False
        )
        
        print(f"✅ Successfully exported {output_file}")
        return True
        
    except Exception as e:
        print(f"❌ Error exporting GLB: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    # Blender's argument parsing (everything after --)
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    
    parser = argparse.ArgumentParser(description='Export Blender scene to GLB')
    parser.add_argument('input', help='Input .blend file')
    parser.add_argument('output', help='Output .glb file')
    
    args = parser.parse_args(argv)
    
    if not os.path.exists(args.input):
        print(f"❌ Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)
    
    export_to_glb(args.input, args.output)
