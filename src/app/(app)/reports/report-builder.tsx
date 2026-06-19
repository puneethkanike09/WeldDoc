"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Input, Select, Textarea, Field } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import {
  WELDING_PROCESSES,
  PRODUCT_TYPES,
  BW_POSITIONS,
  FW_POSITIONS,
  MATERIAL_GROUPS,
} from "@/lib/iso9606/constants";
import type { JointCategory, ProductType, Signatory } from "@/types/db";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface WelderOption {
  id: string;
  full_name: string;
  welder_id: string | null;
  is_new_welder: boolean;
}

interface Row {
  key: string;
  welderId: string;
  process: string;
  product: ProductType;
  position: string;
  materialGroup: string;
  materialGrade: string;
  dimensions: string;
  testThickness: string;
  pipeOd: string;
  visualResult: "Pass" | "Fail";
  mainResult: "Pass" | "Fail" | "NA";
}

function newRow(): Row {
  return {
    key: Math.random().toString(36).slice(2),
    welderId: "",
    process: "135",
    product: "Plate",
    position: "PF",
    materialGroup: "1",
    materialGrade: "",
    dimensions: "",
    testThickness: "",
    pipeOd: "",
    visualResult: "Pass",
    mainResult: "Pass",
  };
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Create report &amp; qualify welders
    </Button>
  );
}

export function ReportBuilder({
  action,
  welders,
  signatories,
}: {
  action: (fd: FormData) => void;
  welders: WelderOption[];
  signatories: Signatory[];
}) {
  const [category, setCategory] = useState<JointCategory>("BW");
  const [rows, setRows] = useState<Row[]>([newRow()]);

  const manufacturers = signatories.filter((s) => s.role === "manufacturer");
  const examiners = signatories.filter((s) => s.role === "examining_body");
  const positions = category === "FW" ? FW_POSITIONS : BW_POSITIONS;

  const serialized = useMemo(
    () =>
      JSON.stringify(
        rows
          .filter((r) => r.welderId)
          .map((r) => ({
            welderId: r.welderId,
            process: r.process,
            product: r.product,
            position: r.position,
            materialGroup: r.materialGroup,
            materialGrade: r.materialGrade,
            dimensions: r.dimensions,
            testThickness: r.testThickness ? Number(r.testThickness) : null,
            pipeOd: r.pipeOd ? Number(r.pipeOd) : null,
            visualResult: r.visualResult,
            mainResult: r.mainResult,
          })),
      ),
    [rows],
  );

  function update(key: string, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="rows" value={serialized} />

      <Card>
        <CardBody className="space-y-5">
          <h3 className="font-display text-base font-semibold text-onyx">
            Test session
          </h3>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Joint category" hint="BW and FW are separate sheets">
              <Select
                name="joint_category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as JointCategory)
                }
              >
                <option value="BW">Butt weld (BW)</option>
                <option value="FW">Fillet weld (FW)</option>
              </Select>
            </Field>
            <Field label="Test date">
              <Input
                type="date"
                name="test_date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </Field>
            <Field label="WPS no.">
              <Input name="wps_no" placeholder="SMS/BBSR/QA/WPS-075 REV-02" />
            </Field>
            <Field label="Manufacturer signatory">
              <Select name="manufacturer_signatory_id" defaultValue="">
                <option value="">— none —</option>
                {manufacturers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Examining body signatory">
              <Select name="examining_body_signatory_id" defaultValue="">
                <option value="">— none —</option>
                {examiners.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Revalidation method">
              <Select name="revalidation_method" defaultValue="9.3b">
                <option value="9.3a">9.3a (3 years)</option>
                <option value="9.3b">9.3b (2 years)</option>
                <option value="9.3c">9.3c (6 months)</option>
              </Select>
            </Field>
          </div>
          <Field label="Remarks">
            <Textarea
              name="remarks"
              rows={2}
              defaultValue="WQT found satisfactory as per EN ISO 9606-1:2017"
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-onyx">
              Welders ({category})
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setRows((rs) => [...rs, newRow()])}
            >
              <Plus className="h-4 w-4" /> Add welder
            </Button>
          </div>

          <div className="space-y-4">
            {rows.map((r, idx) => (
              <div
                key={r.key}
                className="rounded-[12px] border border-silver bg-frost/40 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-sm font-semibold text-graphite">
                    #{idx + 1}
                  </span>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setRows((rs) => rs.filter((x) => x.key !== r.key))
                      }
                      className="text-steel hover:text-expired"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Welder">
                    <Select
                      value={r.welderId}
                      onChange={(e) =>
                        update(r.key, { welderId: e.target.value })
                      }
                    >
                      <option value="">Select welder</option>
                      {welders.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.full_name}
                          {w.welder_id ? ` (${w.welder_id})` : ""}
                          {w.is_new_welder ? " *" : ""}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Process">
                    <Select
                      value={r.process}
                      onChange={(e) =>
                        update(r.key, { process: e.target.value })
                      }
                    >
                      {WELDING_PROCESSES.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name.split(" ")[0]} ({p.code})
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Product">
                    <Select
                      value={r.product}
                      onChange={(e) =>
                        update(r.key, {
                          product: e.target.value as ProductType,
                        })
                      }
                    >
                      {PRODUCT_TYPES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Position">
                    <Select
                      value={r.position}
                      onChange={(e) =>
                        update(r.key, { position: e.target.value })
                      }
                    >
                      {positions.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Material group">
                    <Select
                      value={r.materialGroup}
                      onChange={(e) =>
                        update(r.key, { materialGroup: e.target.value })
                      }
                    >
                      {MATERIAL_GROUPS.map((m) => (
                        <option key={m.code} value={m.code}>
                          Group {m.code}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Material grade">
                    <Input
                      value={r.materialGrade}
                      onChange={(e) =>
                        update(r.key, { materialGrade: e.target.value })
                      }
                      placeholder="IS2062 E250 BR+N"
                    />
                  </Field>
                  <Field label="Dimensions">
                    <Input
                      value={r.dimensions}
                      onChange={(e) =>
                        update(r.key, { dimensions: e.target.value })
                      }
                      placeholder="12(T)x300(W)x250(L)"
                    />
                  </Field>
                  <Field label="Test thickness (mm)">
                    <Input
                      type="number"
                      step="0.1"
                      value={r.testThickness}
                      onChange={(e) =>
                        update(r.key, { testThickness: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Pipe OD (mm)">
                    <Input
                      type="number"
                      step="0.1"
                      value={r.pipeOd}
                      onChange={(e) =>
                        update(r.key, { pipeOd: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Visual">
                    <Select
                      value={r.visualResult}
                      onChange={(e) =>
                        update(r.key, {
                          visualResult: e.target.value as "Pass" | "Fail",
                        })
                      }
                    >
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                    </Select>
                  </Field>
                  <Field label={category === "BW" ? "RT/UT" : "Fracture"}>
                    <Select
                      value={r.mainResult}
                      onChange={(e) =>
                        update(r.key, {
                          mainResult: e.target.value as
                            | "Pass"
                            | "Fail"
                            | "NA",
                        })
                      }
                    >
                      <option value="Pass">Pass</option>
                      <option value="Fail">Fail</option>
                      <option value="NA">N/A</option>
                    </Select>
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-steel">
          A qualification record is created for each welder and the range of
          approval is computed automatically.
        </p>
        <Submit />
      </div>
    </form>
  );
}
