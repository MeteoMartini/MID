import unittest
from qualify_clms_wms import parse_capabilities
MIN=b'''<?xml version="1.0"?><WMS_Capabilities version="1.3.0"><Service><Title>CLMS</Title></Service>
<Capability><Layer><Title>All</Title><Dimension name="time">2026-11-01,2026-11-02</Dimension>
<Layer><Name>FSC:Snow_Cover</Name><Title>Snow</Title></Layer>
<Layer><Name>GFSC:GapFilled</Name><Title>GFSC</Title></Layer></Layer></Capability></WMS_Capabilities>'''
class ClmsWmsDiscoveryTests(unittest.TestCase):
 def test_exact_public_official_product_with_time(self):
  value=parse_capabilities(MIN,'FSC')
  self.assertEqual(value['matchingLayerNames'],['FSC:Snow_Cover'])
  self.assertEqual(value['relatedTimeLayerCount'],1)
  self.assertFalse(value['productionApproved'])
  self.assertFalse(value['realRasterVerified'])
 def test_no_time_is_not_assumed(self):
  src=MIN.replace(b'<Dimension name="time">2026-11-01,2026-11-02</Dimension>',b'')
  self.assertEqual(parse_capabilities(src,'GFSC')['relatedTimeLayerCount'],0)
 def test_reject_unsupported_and_non_wms_or_dtd(self):
  for val in (b'',b'<html/>',b'<!DOCTYPE foo><WMS_Capabilities version="1.3.0"/>',
              b'<WMS_Capabilities version="1.0.0"/>',b'x'*2000001):
   with self.assertRaises((ValueError,Exception)):
    parse_capabilities(val,'FSC')
  with self.assertRaises(ValueError):parse_capabilities(MIN,'Other')
 def test_request_exceptions_do_not_look_like_data(self):
  value=b'<WMS_Capabilities version="1.3.0"><ServiceExceptionReport><ServiceException>none</ServiceException></ServiceExceptionReport></WMS_Capabilities>'
  with self.assertRaises(ValueError):parse_capabilities(value,'FSC')
if __name__=='__main__':unittest.main()
