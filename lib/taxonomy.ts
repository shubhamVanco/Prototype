import type { DefectType } from "@/types";

export const DEFECT_TYPES: DefectType[] = [
  "Sidewall Crack", "Sidewall Cut", "Bulge", "Ozone Crack", "Tread Wear",
  "Uneven Tread Wear", "Tread Chunking", "Exposed Cord", "Shoulder Damage",
  "Bead Damage", "Tread Separation", "Foreign Object", "Liner Damage",
  "Ply Separation", "Run-flat Damage", "Tread Damage", "Abnormal Deformation", "Groove Cracking",
  "Puncture", "Rib Damage", "Impact Damage", "Shoulder Wear",
];

interface Info { meaning: string; why: string }

export const DEFECT_INFO: Record<DefectType, Info> = {
  "Sidewall Crack": {
    meaning: "Cracking can indicate casing deterioration and may reduce suitability for retreading.",
    why: "The sidewall flexes on every rotation. Cracks that reach the body plies let moisture reach the cords and can grow under load, so the casing may fail after retreading.",
  },
  "Sidewall Cut": {
    meaning: "A cut in the sidewall rubber that may expose or damage the casing plies underneath.",
    why: "Sidewalls are thin. A deep cut can sever cords, and a damaged sidewall cannot be repaired to the standard needed for a second life.",
  },
  Bulge: {
    meaning: "A localized bulge suggests broken cords or ply separation inside the casing.",
    why: "A bulge is a classic sign of internal structural failure. It is a safety risk and almost always means the casing is not retreadable.",
  },
  "Ozone Crack": {
    meaning: "Fine surface cracking from ageing and ozone exposure of the rubber.",
    why: "Superficial ozone cracks are common on stored tyres, but deep or widespread cracking indicates an aged casing that needs a technician's judgement.",
  },
  "Tread Wear": {
    meaning: "Normal wear of the tread pattern. Expected on a tyre that is a retread candidate.",
    why: "Wear is what retreading replaces. It only matters when the tread is worn to the point of exposing the casing.",
  },
  "Uneven Tread Wear": {
    meaning: "Wear concentrated on one shoulder or in patches, often caused by alignment or inflation problems.",
    why: "Uneven wear can hide casing fatigue on the heavily worn side and may require more buffing, which reduces remaining casing life.",
  },
  "Tread Chunking": {
    meaning: "Pieces of tread rubber have torn away from the crown.",
    why: "Chunking can be cosmetic or can reveal damage to the belt area. Depth and location decide whether the casing is still usable.",
  },
  "Exposed Cord": {
    meaning: "Steel or textile cords are visible through the rubber.",
    why: "Exposed cords allow moisture to corrode steel and weaken the casing. This is normally a reject condition.",
  },
  "Shoulder Damage": {
    meaning: "Damage or heat wear at the tread shoulder, where tread meets sidewall.",
    why: "The shoulder is a high-stress zone. Damage here can extend into the belt edge, which is hard to judge from the outside.",
  },
  "Bead Damage": {
    meaning: "Damage to the bead area that seats on the rim.",
    why: "The bead carries the load transfer to the rim. Damaged or deformed beads cannot be repaired, so the tyre cannot be reused.",
  },
  "Tread Separation": {
    meaning: "The tread or belt package may be lifting away from the casing.",
    why: "Separation is a leading cause of tyre failure. It may only be partly visible from outside, so manual inspection is required.",
  },
  "Foreign Object": {
    meaning: "An embedded object such as a nail, stone or glass is visible in the tyre.",
    why: "Penetrations can cause hidden internal damage along the path of the object. The injury must be assessed against repair limits.",
  },
  "Liner Damage": {
    meaning: "Damage to the inner liner at the bead or crown area.",
    why: "The inner liner holds air. If it is compromised, air and moisture can enter the casing structure.",
  },
  "Ply Separation": {
    meaning: "Layers of the casing are separating from each other.",
    why: "Ply separation is an internal structural failure. The casing is generally not suitable for retreading.",
  },
  "Run-flat Damage": {
    meaning: "Signs the tyre was driven while deflated, such as sidewall discolouration or scuffing.",
    why: "Running flat overheats and breaks down the internal structure even if the outside looks acceptable. Such tyres are usually rejected.",
  },
  "Tread Damage": {
    meaning: "Visible damage to the tread rubber, such as tearing, missing sections or deep irregular cuts.",
    why: "Severe tread damage can extend into the belt package. How deep it goes cannot be judged from a photo, so it needs physical inspection against the plant's limits.",
  },
  "Abnormal Deformation": {
    meaning: "The tyre profile looks abnormally distorted.",
    why: "Deformation can indicate structural damage inside the casing. It must be distinguished from camera perspective, so confirm physically.",
  },
  "Groove Cracking": {
    meaning: "Cracks at the base of the tread grooves.",
    why: "Groove cracks can reach the belt area if deep. Depth cannot be measured from a photo.",
  },
  Puncture: {
    meaning: "A visible hole or penetration through the tyre surface.",
    why: "The injury path can damage cords inside. It must be assessed against repair limits.",
  },
  "Rib Damage": {
    meaning: "Damage to a tread rib.",
    why: "Rib damage can be cosmetic or can indicate impact or separation. Depth and extent need physical checking.",
  },
  "Impact Damage": {
    meaning: "Visible signs of impact, such as a mark, cut or localized deformation.",
    why: "Impacts can damage the casing without leaving much visible on the surface.",
  },
  "Shoulder Wear": {
    meaning: "Wear concentrated at the tread shoulder.",
    why: "Shoulder wear often points to inflation or alignment problems and may need more buffing.",
  },
};
