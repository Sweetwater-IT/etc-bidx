import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { create } from "zustand";
import { toast } from "sonner";
import type { Job