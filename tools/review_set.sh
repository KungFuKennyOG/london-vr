#!/bin/bash
# The standard review frames (same places and hours every round): tools/review_set.sh <outdir>
D="$(dirname "$0")"; "$D/london_shoot.sh" "$1" 01_start_night,11.6,-1.5,0,23.5 02_highstreet_night,-118,11.6,-1.75,23.5 03_terrace_day,140,69.5,-1.57,13 \
  04_boxing_club,-244,121,-0.7,1 05_weavers_dusk,-182,95,-1.9,19.3 06_bramley_towers,178,-93,2.28,22,.15 07_arnold_circus,-254.6,-113,3.14,23 08_decks,-60,-106,3.14,21,.05 \
  09_church_day,253,11.5,3.14,11,.1 10_junction_day,318,15,2.4,16 11_church_night,253,11.5,3.14,23,.1 12_wilmot_day,-21.5,-60,3.14,10

